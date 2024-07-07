const MAX_CHAT_SECONDS = 120;
const MimeType = "audio/mp3";
/**
 * mp3音频录制Hook
 */
export function useRecording(options: { timeslice?: number } = { timeslice: 1000 }) {
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
      return ElMessage.error("当前浏览器不支持语音转文字！");
    speechRecognition.start();
    speechRecognition.recognition?.addEventListener("result", (e) => {
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results?.[i];
        if (result && result.isFinal && result?.[0])
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
      if (!navigator?.mediaDevices?.getUserMedia)
        return ElMessage.error("设备不支持录音！");

      navigator?.mediaDevices?.getUserMedia({ audio: true, video: false }).then(
        stream => resolveAudioInput(stream),
        () => ElMessage.warning("用户取消授权麦克风！"),
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
      speechRecognition.start(); // 开始语音转文字
    });

    mediaRecorderContext.value.addEventListener("stop", (e) => {
      isChating.value = false;
      if (!audioChunks.length && second.value <= 2) {
        ElMessage.warning("录音时间过短！");
        return;
      }
      // 转化为文件上传
      const file = new File(audioChunks, `${Date.now()}.mp3`, { type: MimeType });
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
