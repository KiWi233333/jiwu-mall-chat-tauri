const MAX_CHAT_SECONDS = 120;
const MimeType = "audio/mp3";
/**
 * mp3音频录制Hook
 */
export function useRecording(options: { timeslice?: number } = { timeslice: 1000 }) {
  const setting = useSettingStore();
  // opt
  const { timeslice } = options;
  // 变量
  const onEndChat = createEventHook<File>();
  const mediaRecorderContext = shallowRef<MediaRecorder>(); // 录音对象
  const isChating = ref(); // 是否正在聊天
  let audioChunks: Blob[] = [];
  const theAudioFile = shallowRef<OssFile>(); // 录音文件
  const isPalyAudio = ref(false); // 是否正在播放音频
  const palyAudioContext = ref<HTMLAudioElement>();
  const startEndTime = reactive({ // 录音时间
    startTime: 0,
    endTime: 0,
  });

  // 获取文件大小限制
  const fileSizeLimit = computed(() => setting.systemConstant.ossInfo?.audio?.fileSize || 20 * 1024 * 1024); // 默认限制为20MB
  // 录音秒数
  const second = computed(() => {
    const diff = (startEndTime.endTime - startEndTime.startTime) / 1000 || 0;
    if (diff > 0 && startEndTime.endTime > 0)
      return +diff.toFixed(0);
    else
      return 0;
  }); // 录音时长

  // 语音转译文字
  const speechRecognition = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    lang: "zh-CN",
  });
  const audioTransfromTextList = ref<string[]>([]);
  const audioTransfromText = computed(() => audioTransfromTextList.value.join(""));
  async function useAudioTransfromText() {
    if (!speechRecognition.isSupported)
      return ElMessage.error("当前不支持语音转文字！");
    speechRecognition.start();
    speechRecognition.recognition?.addEventListener("result", (e) => {
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results?.[i];
        if (result && result?.[0])
          audioTransfromTextList.value[i] = result?.[0].transcript;
      }
    });
  }


  /**
   * 重置
   */
  const reset = () => {
    audioChunks = [];
    theAudioFile.value = undefined;
    startEndTime.startTime = 0;
    startEndTime.endTime = 0;
    isChating.value = false;
    isPalyAudio.value = false;
    palyAudioContext.value = undefined;
    audioTransfromTextList.value = [];
  };

  // 开始录音
  function toggle() {
    if (isChating.value) {
      if (second.value < 1) {
        ElMessage.warning("录音时间过短！");
        return;
      }
      speechRecognition.stop();
    }
    else {
      useAudioTransfromText();
    }
    isChating.value = !isChating.value;
  }

  // 播放录音
  function handlePlayAudio(type: "play" | "del" | "stop", url?: string) {
    if (!type)
      return;
    const _url = url || theAudioFile.value?.id;
    if (_url && !isPalyAudio.value && type === "play") {
      const audio = new Audio(_url);
      palyAudioContext.value = audio;
      audio.play();
      isPalyAudio.value = true;
      audio.addEventListener("ended", () => {
        isPalyAudio.value = false;
      });
    }
    else if (isPalyAudio.value && type === "stop") {
      isPalyAudio.value = false;
      palyAudioContext.value?.pause();
    }
    else if (type === "del") {
      isPalyAudio.value = false;
      palyAudioContext.value?.pause();
      reset();
    }
  }

  // 监听是否录音
  watch(isChating, (val) => {
    if (val) {
      if (!navigator?.mediaDevices?.getUserMedia) {
        isChating.value = false;
        return ElMessage.error("设备不支持录音！");
      }
      // 重新授权
      navigator?.mediaDevices?.getUserMedia({ audio: true, video: false }).then(
        stream => resolveAudioInput(stream),
        (reason) => {
          isChating.value = false;
          if (reason.code === 0) {
            ElMessage.warning("暂无麦克风权限！");
            return;
          }
          ElMessage.warning("拒绝授权麦克风，录音功能无法使用！");
        },
      );
    }
    else {
      mediaRecorderContext.value?.stop?.();
    }
  }, {
    immediate: false,
  });

  // 解析音频输入
  function resolveAudioInput(stream: MediaStream) {
    if (mediaRecorderContext.value) { // 防止重复创建
      mediaRecorderContext.value?.stop?.();
      mediaRecorderContext.value = undefined;
    }
    const recorder = new MediaRecorder(stream, {
      audioBitsPerSecond: 128000,
      mimeType: "audio/webm",
    });
    if (!recorder) {
      ElMessage.error("设备不支持录音！");
      return;
    }
    mediaRecorderContext.value = recorder;
    // 监听录音数据
    mediaRecorderContext.value.start(timeslice);// 1秒采样率
    startEndTime.startTime = Date.now();

    mediaRecorderContext.value.addEventListener("dataavailable", (e) => {
      const blob = new Blob([e.data], { type: MimeType });
      startEndTime.endTime = Date.now();
      audioChunks.push(blob);
      if (second.value >= MAX_CHAT_SECONDS) {
        ElMessage.warning("录音时间过长！");
        mediaRecorderContext.value?.stop?.();
        speechRecognition.stop();
        return;
      }
      if (speechRecognition) {
        try {
          speechRecognition?.start(); // 开始语音转文字
        }
        catch (error) {
          console.warn(error);
        }
      }
    });

    mediaRecorderContext.value.addEventListener("stop", (e) => {
      isChating.value = false;
      if (!audioChunks.length && second.value <= 2) {
        ElMessage.warning("录音时间过短！");
        return;
      }
      // 转化为文件上传
      const file = new File(audioChunks, `${Date.now()}.mp3`, { type: MimeType });
      console.log(`结束录音,时长：${second.value}s 文件大小：${formatFileSize(file.size)}`);

      if (file.size > fileSizeLimit.value) {
        ElMessage.error(`文件大小超过限制，最大支持 ${formatFileSize(fileSizeLimit.value)}`);
        reset();
        return;
      }
      theAudioFile.value = {
        id: URL.createObjectURL(file),
        key: undefined,
        status: "",
        percent: 0,
        file, // 文件对象
      };
      if (!theAudioFile.value)
        return;
      const url = window.URL.createObjectURL(file);
      theAudioFile.value.id = url;
      onEndChat.trigger(file);
    });
  }

  return {
    fileSizeLimit, // 文件大小限制
    // 录音相关
    isChating,
    second,
    theAudioFile,
    audioTransfromText,
    toggle, // 开始/停止录音
    stop,
    reset,
    onEndChat: onEndChat.on,
    // 语音转文字
    speechRecognition,
    // 播放录音相关
    isPalyAudio,
    handlePlayAudio,
  };
}

/**
 * 识别@用户
 * @param text 文本内容
 * @param userOptions 所有用户列表
 * @returns
 *  uidList: 识别到的@用户的uid列表
 *  atUidList: 识别到的@用户的{userId, nickName}列表
 */
export function useAtUsers(text: string, userOptions: AtChatMemberOption[], configs: AtConfigs = { regExp: /@\S+\(#(\S+)\)\s/g }): { uidList: string[]; atUidList: AtChatMemberOption[] } {
  const { regExp } = configs;
  if (!regExp || !text)
    throw new Error("regExp is required");
  const atUidList: AtChatMemberOption[] = [];
  const matches = text.matchAll(regExp);
  for (const match of matches) {
    // 识别@和括号直接的昵称
    if (match[1]) {
      const atUser = userOptions.find(u => u.username === match[1]);
      if (atUser)
        atUidList.push(atUser);
    }
  }
  return {
    uidList: atUidList.map(p => p.userId) || [],
    atUidList: JSON.parse(JSON.stringify(atUidList)),
  };
}
/**
 * 处理/AI回复
 * @param text 文本内容
 * @param aiOptions 所有AI列表
 * @returns
 *  aiReply: 识别到的/AI回复
 */
export function useAiReply(text: string, aiOptions: AskAiRobotOption[], configs: AtConfigs = { regExp: /\/\S+\(#(\S+)\)\s/g }): { aiRobitUidList: string[]; aiRobotList: AskAiRobotOption[] } {
  const { regExp } = configs;
  if (!regExp || !text)
    throw new Error("regExp is required");
  const aiRobotList: AskAiRobotOption[] = [];
  const matches = text.matchAll(regExp);
  for (const match of matches) {
    // 识别/和括号直接的昵称
    if (match[1]) {
      const aiRobot = aiOptions.find(u => u.username === match[1]);
      if (aiRobot)
        aiRobotList.push(aiRobot);
    }
  }
  return {
    aiRobitUidList: aiRobotList.map(p => p.userId) || [],
    aiRobotList: JSON.parse(JSON.stringify(aiRobotList)),
  };
}

export function formatAiReplyTxt(item: AskAiRobotOption) {
  return `/${item.nickName}(#${item.username}) `;
}

export interface AtConfigs {
  regExp?: RegExp
}


/**
 * 加载@用户列表
 * @returns
 *  userOptions: 所有用户列表
 *  userAtOptions: 未添加的用户列表
 *  loadUser: 加载用户列表
 */
export function useLoadAtUserList() {
// AT @相关
  const chat = useChatStore();
  const user = useUserStore();
  const userOptions = ref<AtChatMemberOption[]>([]);
  const userAtOptions = computed(() => chat.theContact.type === RoomType.GROUP ? userOptions.value.filter(u => !chat.atUserList.find(a => a.userId === u.userId)) : []); // 过滤已存在的用户

  /**
   * 加载@用户列表
   */
  async function loadUser() {
    if (!chat.theContact.roomId || chat.theContact.type !== RoomType.GROUP)
      return;
    const { data, code } = await getRoomGroupAllUser(chat.theContact.roomId, user.getToken);
    if (data && code === StatusCode.SUCCESS) {
      userOptions.value = (data || []).map((u: ChatMemberSeVO) => ({
        label: u.nickName,
        value: `${u.nickName}(#${u.username})`,
        userId: u.userId,
        avatar: u.avatar,
        username: u.username,
        nickName: u.nickName,
      })).filter((u: AtChatMemberOption) => u.userId !== user.userInfo.id);
    }
  }

  // 加载用户
  const ws = useWsStore();
  watchDebounced(() => ws.wsMsgList.memberMsg.length, (len) => {
    if (!len)
      return;
    loadUser();
  }, {
    debounce: 500,
  });
  return {
    userOptions,
    userAtOptions,
    loadUser,
  };
}

/**
 * 处理@删除
 * @param context 文本内容
 * @param pattern 正则
 * @param prefix 前缀
 * @returns 是否匹配删除
 */
export function checkAtUserWhole(context: string | undefined | null, pattern: string, prefix: string) {
  const chat = useChatStore();
  if (prefix !== "@")
    return false;
  const atUserListOpt = chat.atUserList.map(u => ({
    ...u,
    label: `${u.nickName}(#${u.username})`,
    value: u.userId,
  }));
  if (pattern && context?.endsWith(`${prefix + pattern} `)) {
    const user = atUserListOpt.find(u => u.label === pattern.trim());
    if (user)
      chat.removeAtByUsername(user.username);
  }
  return true;
}

/**
 * 加载/AI列表
 * @returns
 *  aiOptions: 所有AI列表
 *  loadAi: 加载AI列表
 */
export function useLoadAiList() {
  const chat = useChatStore();
  const user = useUserStore();
  const aiOptions = ref<AskAiRobotOption[]>([]);

  /**
   * 加载AI列表
   */
  async function loadAi() {
    if (!chat.theContact.roomId || chat.theContact.type !== RoomType.GROUP)
      return;
    const { data, code } = await getAiRobotList(user.getToken);
    if (data && code === StatusCode.SUCCESS) {
      aiOptions.value = (data || []).map((u: RobotUserVO) => ({
        label: u.nickname,
        value: `${u.nickname}(#${u.username})`,
        userId: u.userId,
        avatar: u.avatar,
        username: u.username,
        nickName: u.nickname,
        aiRobotInfo: u,
      }));
    }
  }
  // 加载AI
  const ws = useWsStore();
  watchDebounced(() => ws.wsMsgList.memberMsg.length, (len) => {
    if (!len)
      return;
    loadAi();
  }, {
    debounce: 500,
    immediate: true,
  });
  return {
    aiOptions,
    loadAi,
  };
}

export function checkAiReplyWhole(context: string | undefined | null, pattern: string, prefix: string) {
  const chat = useChatStore();
  if (prefix !== "/")
    return false;
  const atUserListOpt = chat.atUserList.map(u => ({
    ...u,
    label: `${u.nickName}(#${u.username})`,
    value: u.userId,
  }));
  if (pattern && context?.endsWith(`${prefix + pattern} `)) {
    const user = atUserListOpt.find(u => u.label === pattern.trim());
    if (user)
      chat.removeAtByUsername(user.username);
  }
  return true;
}


export interface AtChatMemberOption {
  label: string
  value: string
  userId: string
  username: string
  nickName?: string
  avatar?: string
}
export interface AskAiRobotOption extends AtChatMemberOption {
  aiRobotInfo?: RobotUserVO;
}
