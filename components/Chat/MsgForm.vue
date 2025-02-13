<script lang="ts" setup>
import ContextMenu from "@imengyu/vue3-context-menu";
import { FILE_TYPE_ICON_DEFAULT, FILE_TYPE_ICON_MAP, formatFileSize } from "~/composables/api/res/file";

const emit = defineEmits<{
  (e: "submit", newMsg: ChatMessageVO): void
}>();
const user = useUserStore();
const chat = useChatStore();
const setting = useSettingStore();

// 读取@用户列表 hook
const { userOptions, userAtOptions, loadUser } = useLoadAtUserList();
const { aiOptions, loadAi } = useLoadAiList();
const isReplyAI = computed(() => chat.msgForm.content?.startsWith("/") && chat.theContact.hotFlag);
// 表单
const isSending = ref(false);
const isDisabledFile = computed(() => !user?.isLogin || chat.theContact.selfExist === 0);
const isNotExistOrNorFriend = computed(() => chat.theContact.selfExist === 0 || chat.contactMap?.[chat.theContact.roomId]?.isFriend === 0); // 自己不存在 或 不是好友
const isLord = computed(() => chat.theContact.type === RoomType.GROUP && chat.theContact.member?.role === ChatRoomRoleEnum.OWNER); // 群主
const isSelfRoom = computed(() => chat.theContact.type === RoomType.SELFT); // 私聊
// 状态
const showGroupNoticeDialog = ref(false);
const loadInputDone = ref(false); // 用于移动尺寸动画
const loadInputTimer = shallowRef<NodeJS.Timeout>();

// ref
const inputAllRef = useTemplateRef("inputAllRef"); // 输入框
const formRef = useTemplateRef("formRef"); // 表单

// 阅读本房间（防抖）
const setReadListDebounce = useDebounceFn(() => {
  // console.log("read room");
  chat.theContact.roomId && chat.setReadList(chat.theContact.roomId);
}, 400);

// hooks
// Oss上传
const {
  imgList,
  fileList,
  videoList,
  isUploadImg,
  isUploadFile,
  isUploadVideo,
  onSubmitImg,
  onSubmitFile,
  onSubmitVideo,
  onPaste,
  showVideoDialog,
  inputOssImgUploadRef,
  inputOssVideoUploadRef,
  inputOssFileUploadRef,
} = useFileUpload({ img: "inputOssImgUploadRef", file: "inputOssFileUploadRef", video: "inputOssVideoUploadRef" });
// 录音
const {
  isChating,
  second, // 获取录音时间
  theAudioFile,
  speechRecognition,
  audioTransfromText,
  isPalyAudio,
  pressHandleRef,
  reset: resetAudio,
  start: startAudio,
  handlePlayAudio, // 播放录音
} = useRecording({ pressHandleRefName: "pressHandleRef", timeslice: 1000 });
// computed
const isBtnLoading = computed(() => isSending.value || isUploadImg.value || isUploadFile.value || isUploadVideo.value);

/**
 * 发送消息
 */
async function onSubmit() {
  if (isSending.value)
    return;
  formRef.value?.validate(async (action: boolean) => {
    if (!action)
      return;
    if (chat.msgForm.msgType === MessageType.TEXT && (!chat.msgForm.content || chat.msgForm.content?.trim().length > 500))
      return;

    const formDataTemp = JSON.parse(JSON.stringify(chat.msgForm));
    if (chat.theContact.type === RoomType.GROUP && chat.msgForm.content) {
      if (document.querySelector(".at-select")) // enter冲突at选择框
        return;

      // 处理 @用户
      const { atUidList } = resolveAtUsers(formDataTemp.content, userOptions.value);
      if (atUidList?.length) {
        chat.atUserList = [...atUidList];
        formDataTemp.body.atUidList = [...new Set(atUidList)];
      }

      // 处理 AI机器人
      const { aiRobotList } = resolteAiReply(formDataTemp.content, aiOptions.value);
      if (aiRobotList[0]) {
        formDataTemp.content = formDataTemp.content.replace(formatAiReplyTxt(aiRobotList[0]), ""); // 剔除ai的显示
        if (!formDataTemp.content.trim())
          return;
        formDataTemp.body = {
          userId: aiRobotList[0].userId,
          modelCode: 1,
          businessCode: 1,
        };
        formDataTemp.msgType = MessageType.AI_CHAT; // 设置对应消息类型
      }
    };
    // 图片
    if (formDataTemp.msgType === MessageType.IMG) {
      if (isUploadImg.value) {
        ElMessage.warning("图片正在上传中，请稍等！");
        return;
      }
      if (imgList.value.length > 1) {
        await multiSubmitImg();
        return;
      }
    }
    // 文件
    if (formDataTemp.msgType === MessageType.FILE && isUploadFile.value) {
      ElMessage.warning("文件正在上传中，请稍等！");
      return;
    }
    // 视频
    if (formDataTemp.msgType === MessageType.VIDEO && isUploadVideo.value) {
      ElMessage.warning("视频正在上传中，请稍等！");
      return;
    }
    // 开始提交
    isSending.value = true;
    // 语音消息 二次处理
    if (formDataTemp.msgType === MessageType.SOUND) {
      await onSubmitSound((key) => {
        formDataTemp.body.url = key;
        formDataTemp.body.translation = audioTransfromText.value;
        formDataTemp.body.second = second.value;
        submit(formDataTemp);
      });
      return;
    }
    // 普通消息
    submit(formDataTemp);
  });
}

/**
 *
 */
async function submit(formData: ChatMessageDTO = chat.msgForm, callback?: (msg: ChatMessageVO) => void) {
  const res = await addChatMessage({
    ...formData,
    roomId: chat.theContact.roomId,
  }, user.getToken);
  isSending.value = false;
  if (res.code === StatusCode.SUCCESS) {
    // 发送信息后触发
    emit("submit", res.data);
    // 追加消息
    chat?.appendMsg(res.data);
    await nextTick();
    chat.scrollBottom?.(false);
    // 消息阅读上报（延迟）
    resetForm();
    setReadListDebounce();
    typeof callback === "function" && callback(res.data); // 执行回调
  }
  else if (res.message === "您和对方已不是好友！") {
    resetForm();
  }
}

/**
 * 批量发送图片消息
 */
async function multiSubmitImg() {
  isSending.value = true;
  const formTemp = JSON.parse(JSON.stringify(chat.msgForm));
  // 批量发送图片消息
  const uploadedFiles = new Set(); // 用来跟踪已经上传的文件
  for (const file of imgList.value) {
    chat.msgForm = {
      roomId: chat.theContact.roomId,
      msgType: MessageType.IMG, // 默认
      content: "",
      body: {
        url: file.key!,
        size: file?.file?.size || 0,
      },
    };
    await submit(chat.msgForm); // 等待提交完成
    uploadedFiles.add(file.key); // 标记文件为已上传
  }
  // 一次性移除所有已上传的文件
  imgList.value = imgList.value.filter(file => !uploadedFiles.has(file.key));

  // 发送文本消息
  if (formTemp.content) {
    formTemp.body.url = undefined;
    formTemp.body.size = undefined;
    formTemp.msgType = MessageType.TEXT; // 默认
    chat.msgForm = {
      ...formTemp,
      roomId: chat.theContact.roomId,
      msgType: MessageType.TEXT, // 默认
    };
    await submit(chat.msgForm);
  }
  isSending.value = false;
}

/**
 * 发送群通知消息
 */
function onSubmitGroupNoticeMsg(formData: ChatMessageDTO) {
  if (!isLord.value) {
    ElMessage.error("仅群主可发送群通知消息！");
    return;
  }
  const replyMsgId = chat.msgForm?.body?.replyMsgId;
  chat.msgForm = {
    roomId: chat.theContact.roomId,
    msgType: MessageType.GROUP_NOTICE,
    content: "",
    body: {
    },
  };
  const body = formData?.body as any;
  submit({
    roomId: chat.theContact.roomId,
    msgType: MessageType.GROUP_NOTICE,
    content: formData.content,
    body: {
      // TODO: 后期可支持富文本编辑
      noticeAll: body?.noticeAll, // 是否群发
      imgList: body?.imgList, // 图片列表
      replyMsgId: body?.replyMsgId || replyMsgId || undefined, // 回复消息ID
    },
  });
}

/**
 * 单按键触发事件
 */
function onInputExactKey(key: "ArrowUp" | "ArrowDown") {
  if (!chat.msgForm.content?.trim() && (key === "ArrowUp" || key === "ArrowDown")) {
    chat.onDownUpChangeRoom(key === "ArrowDown" ? "down" : "up");
  }
}

/**
 * 发送语音
 * @param callback 上传成功回调
 */
async function onSubmitSound(callback: (key: string) => void) {
  if (!theAudioFile.value || !theAudioFile?.value?.id) {
    isSending.value = false;
    return false;
  }
  return await useOssUpload(OssFileType.SOUND, theAudioFile.value as OssFile, user.getToken, {
    callback(event, data, file) {
      if (event === "error") {
        isSending.value = false;
        ElMessage.error("发送语音失败，请稍后再试！");
      }
      else if (event === "success") {
        callback(data);
      }
    },
  });
}

// 重置表单
function resetForm() {
  chat.msgForm = {
    roomId: chat.theContact.roomId,
    msgType: MessageType.TEXT, // 默认
    content: "",
    body: {
      atUidList: [],
    },
  };
  imgList.value = [];
  fileList.value = [];
  videoList.value = []; // 清空视频
  // store
  chat.atUserList.splice(0);
  chat.askAiRobotList.splice(0);

  // 重置上传
  inputOssImgUploadRef.value?.resetInput?.();
  inputOssFileUploadRef.value?.resetInput?.();
  inputOssVideoUploadRef.value?.resetInput?.();
  isSending.value = false;
  chat.setReplyMsg({});
  resetAudio();
}

/**
 * 右键菜单
 * @param e 事件对象
 * @param key key
 * @param index 索引
 */
function onContextMenu(e: MouseEvent, key?: string, index: number = 0, type: OssFileType = OssFileType.IMAGE) {
  e.preventDefault();
  const textMap = {
    [OssFileType.IMAGE]: "图片",
    [OssFileType.FILE]: "文件",
    [OssFileType.VIDEO]: "视频",
    [OssFileType.SOUND]: "语音",
  } as Record<OssFileType, string>;
  const opt = {
    x: e.x,
    y: e.y,
    theme: setting.contextMenuTheme,
    items: [
      {
        customClass: "group",
        icon: "i-solar:trash-bin-minimalistic-outline group-btn-danger",
        label: `删除${textMap[type]}`,
        onClick: async () => {
          if (!key)
            return;
          const filesMap: Record<OssFileType, (Ref<OssFile[]> | undefined)> = {
            [OssFileType.IMAGE]: imgList,
            [OssFileType.FILE]: fileList,
            [OssFileType.VIDEO]: videoList,
            [OssFileType.SOUND]: undefined,
            [OssFileType.FONT]: undefined,
          };
          const item = filesMap?.[type]?.value.find(f => f.key === key);
          if (item)
            item.subscribe.unsubscribe();
          const keys = [key, ...(item?.children || []).map(f => f.key)];
          keys.forEach(k => k && deleteOssFile(k, user.getToken));
          ElMessage.closeAll("error");
          if (type === OssFileType.IMAGE) {
            imgList.value.splice(
              index,
              1,
            );
            inputOssImgUploadRef?.value?.resetInput?.();
          }
          filesMap?.[type]?.value.splice(
            index,
            1,
          );
          inputOssFileUploadRef?.value?.resetInput?.();
        },
      },
    ],
  };
  ContextMenu.showContextMenu(opt);
}

// 到底部并消费消息
function setReadAndScrollBottom() {
  if (chat.theContact.roomId) {
    chat.setReadList(chat.theContact.roomId);
    chat.scrollBottom();
  }
}

// watch
// 房间号变化
let timer: any = 0;
watch(() => chat.theContact.roomId, (newVal, oldVal) => {
  if (newVal === oldVal) {
    return;
  }
  resetForm();
  // 加载数据
  loadUser();
  loadAi();
  loadInputTimer.value && clearTimeout(loadInputTimer.value);
  if (!setting.isMobileSize) {
    loadInputDone.value = true;
  }
  else {
    loadInputTimer.value = setTimeout(() => {
      loadInputDone.value = true;
    }, 400);
    return;
  }
  if (inputAllRef.value?.input)
    inputAllRef.value?.input?.focus(); // 聚焦
}, {
  immediate: true,
});

// 回复消息
watch(() => chat.replyMsg?.message?.id, (val) => {
  chat.msgForm.body = {
    ...chat.msgForm.body,
    replyMsgId: val,
  };
  nextTick(() => {
    if (inputAllRef.value?.input)
      inputAllRef.value?.input?.focus(); // 聚焦
  });
});

// 生命周期
onMounted(() => {
  // 监听快捷键
  window.addEventListener("keydown", startAudio);
  !setting.isMobileSize && inputAllRef.value?.input?.focus(); // 聚焦
  // At 用户
  mitter.on(MittEventType.CHAT_AT_USER, (e) => {
    if (isReplyAI.value) {
      // TODO: 待后期考虑添加引用@信息，让去理解
      ElMessage.warning("当前使用AI机器人无法@其他人");
      return;
    }
    const { type, payload: userId } = e;
    const user = userOptions.value.find(u => u.userId === userId);
    if (type === "add" && user) {
      if (user) {
        chat.msgForm.content += `@${user.nickName}(#${user.username}) `;
        inputAllRef.value?.input?.focus(); // 聚焦
      }
    }
    else if (type === "remove" && user) {
    // const atIndex = chat.msgForm.content.lastIndexOf(`@${payload.nickName}(#${payload.username}) `);
    // if (atIndex > -1) {
    //   chat.msgForm.content = chat.msgForm.content.slice(0, atIndex) + chat.msgForm.content.slice(atIndex + 3 + payload.username.length);
    // }
    }
    else if (type === "clear") {
    //
    }
  });
  // / 询问ai机器人
  mitter.on(MittEventType.CAHT_ASK_AI_ROBOT, (e) => {
    const { type, payload: userId } = e;
    const robot = aiOptions.value.find(u => u.userId === userId);
    if (type === "add" && robot) {
      if (robot) {
        chat.msgForm.content += `/${robot.nickName}(#${robot.username}) `;
        inputAllRef.value?.input?.focus(); // 聚焦
      }
    }
    else if (type === "remove" && robot) {
    //
    }
    else if (type === "clear") {
    //
    }
  });
  // 处理聚焦
  mitter.on(MittEventType.MSG_FORM, ({
    type,
    // payload ={}
  }: MsgFormEventPlaoyload) => {
    if (type === "focus") {
      inputAllRef.value?.input?.focus(); // 聚焦
    }
    else if (type === "blur") {
      inputAllRef.value?.input?.blur(); // 聚焦
    }
  });
});

onUnmounted(() => {
  mitter.off(MittEventType.CAHT_ASK_AI_ROBOT);
  mitter.off(MittEventType.CHAT_AT_USER);
  clearTimeout(timer);
  clearInterval(timer);
  timer = null;
  loadInputTimer.value && clearTimeout(loadInputTimer.value);
  window.removeEventListener("keydown", startAudio);
});
</script>

<template>
  <el-form
    ref="formRef"
    :model="chat.msgForm"
    v-bind="$attrs"
    :disabled="isDisabledFile"
  >
    <div class="absolute w-full flex flex-col p-2 -transform-translate-y-full" @click.prevent="() => {}">
      <!-- 滚动底部 -->
      <div
        v-if="chat.theContact?.msgList?.length > 20"
        data-fade mb-2 ml-a mr-2 w-fit rounded-full px-3 text-right shadow-lg btn-info card-bg-color border-default-hover @click="setReadAndScrollBottom"
      >
        <i class="i-solar:double-alt-arrow-down-line-duotone block h-5 w-5 transition-200" />
      </div>
      <!-- 新消息 -->
      <div
        v-show="chat.theContact.unreadCount"
        class="w-full cursor-pointer"
        style="padding: 0 0.5rem;margin:0;margin-bottom:0.4rem;display: flex;justify-content: right;"
        @click="setReadAndScrollBottom"
      >
        <el-tag type="warning" effect="light" round class="ml-a">
          有 {{ chat.theContact.unreadCount }} 条新消息
        </el-tag>
      </div>
      <!-- 图片 -->
      <div
        v-if="imgList.length > 0"
        class="w-full flex flex-wrap cursor-pointer justify-end gap-2"
        style="padding: 0 0.5rem;margin:0;margin-bottom:0.4rem;"
      >
        <div
          v-for="(img, i) in imgList" :key="i" v-loading="img.status !== 'success'"
          class="relative flex-row-c-c shadow-sm transition-shadow border-default card-default hover:shadow"
          :element-loading-spinner="defaultLoadingIcon"
          element-loading-background="transparent"
          @contextmenu="onContextMenu($event, img.key, i, OssFileType.IMAGE)"
        >
          <CardElImage
            preview-teleported
            loading="lazy"
            :preview-src-list="[img.id || BaseUrlImg + img.key]"
            :src="img.id || BaseUrlImg + img.key"
            class="rounded"
            :class="imgList.length > 1 ? 'w-4rem h-4rem sm:(w-6rem h-6rem)' : 'h-9rem max-w-16rem'"
            title="左键放大 | 右键删除"
          />
        </div>
      </div>
      <!-- 视频 -->
      <div
        v-if="videoList.length > 0"
        class="w-full cursor-pointer"
        style="padding: 0 0.5rem;margin:0;margin-bottom:0.4rem;display: flex;width:fit-content;justify-content: center;gap: 0.5rem;grid-gap:4;margin-left: auto;"
      >
        <div
          v-for="(video, i) in videoList"
          :key="i"
          title="点击播放[视频]"
          class="relative"
          @click="showVideoDialog($event, video)"
          @contextmenu="onContextMenu($event, video.key, i, OssFileType.VIDEO)"
        >
          <div
            v-if="video?.children?.[0]?.id"
            v-loading="video.status !== 'success'"
            :element-loading-spinner="defaultLoadingIcon"
            element-loading-background="transparent"
            class="relative flex-row-c-c cursor-pointer"
          >
            <img
              error-class="i-solar:file-smile-line-duotone p-2.8"
              :src="video?.children?.[0]?.id"
              class="h-full max-h-16rem max-w-16rem min-h-8rem min-w-8rem w-full flex-row-c-c shadow card-default"
            >
            <div class="play-btn h-12 w-12 flex-row-c-c rounded-full absolute-center-center" style="border-width: 2px;">
              <i i-solar:alt-arrow-right-bold ml-1 p-4 />
            </div>
          </div>
          <div class="mt-1 w-full truncate card-rounded-df pb-2 pl-3 pr-2 backdrop-blur transition-all bg-color-br" :class="video.status !== 'success' ? 'h-8' : 'h-0 !p-0 '">
            <el-progress
              striped
              :striped-flow="video.status !== 'success'"
              :duration="10"
              class="absolute mt-2 min-w-8em w-full"
              :percentage="video.percent" :stroke-width="4" :status="video?.status as any || ''"
            >
              {{ formatFileSize(video?.file?.size || 0) }}
            </el-progress>
          </div>
          <!-- <div v-if="formattedDuration" class="bg-blur absolute bottom-1 right-2 text-shadow">
            {{ formattedDuration }}
          </div> -->
        </div>
      </div>
      <!-- 文件 -->
      <div
        v-if="fileList.length > 0"
        class="w-full cursor-pointer"
        style="padding: 0 0.5rem;margin:0;margin-bottom:0.4rem;display: flex;width:fit-content;justify-content: center;gap: 0.5rem;grid-gap:4;margin-left: auto;"
      >
        <div
          v-for="(file, i) in fileList"
          :key="i" class="flex-row-c-c p-3.2 shadow-sm transition-all border-default card-default bg-color sm:p-2.8 hover:shadow"
          @contextmenu="onContextMenu($event, file.key, i, OssFileType.FILE)"
        >
          <img :src="file?.file?.type ? (FILE_TYPE_ICON_MAP[file?.file?.type] || FILE_TYPE_ICON_DEFAULT) : FILE_TYPE_ICON_DEFAULT" class="mr-2 h-8 w-8">
          <div class="max-w-16rem min-w-8rem">
            <p class="truncate text-sm">
              {{ (file?.file?.name || file.key)?.replace(/(.{10}).*(\..+)/, '$1****$2') }}
            </p>
            <el-progress
              striped
              :striped-flow="file.status !== 'success'"
              :duration="10"
              class="mt-2"
              :percentage="file.percent" :stroke-width="4" :status="file?.status as any || ''"
            >
              {{ formatFileSize(file?.file?.size || 0) }}
            </el-progress>
          </div>
        </div>
      </div>
      <!-- 回复 -->
      <div
        v-if="chat.replyMsg?.fromUser"
        prop="body.replyMsgId"
        class="w-full text-sm"
      >
        <div class="w-full flex animate-[300ms_fade-in] items-center p-2 shadow card-default-br border-default-hover">
          <el-tag effect="dark" size="small" class="mr-2 shrink-0">
            回复
          </el-tag>

          <div class="max-w-4/5 truncate">
            {{ `${chat.replyMsg?.fromUser?.nickName}: ${resolveMsgReplyText(chat.replyMsg as ChatMessageVO)}` }}
          </div>
          <!-- <ChatMsgContentCard  :data="chat.replyMsg" /> -->
          <div class="i-solar:close-circle-bold ml-a h-6 w-6 text-dark op-80 transition-200 transition-color sm:(h-5 w-5) btn-default dark:text-light hover:text-[var(--el-color-danger)]" @click="chat.setReplyMsg({})" />
        </div>
      </div>
    </div>
    <div class="form-tools relative sm:h-62">
      <!-- 工具栏 -->
      <div
        class="relative flex items-center gap-4 px-2"
      >
        <el-tooltip popper-style="padding: 0.2em 0.5em;" :content="chat.msgForm.msgType !== MessageType.SOUND ? (setting.isMobileSize ? '语音' : '语音 Ctrl+T') : '键盘'" placement="top">
          <i
            :class="chat.msgForm.msgType !== MessageType.SOUND ? 'i-solar:microphone-3-broken hover:animate-pulse' : 'i-solar:keyboard-broken'"
            class="h-6 w-6 cursor-pointer btn-primary"
            @click="chat.msgForm.msgType = chat.msgForm.msgType === MessageType.TEXT ? MessageType.SOUND : MessageType.TEXT"
          />
        </el-tooltip>
        <!-- 语音 -->
        <div v-show="chat.msgForm.msgType === MessageType.SOUND && !theAudioFile?.id" class="absolute-center-x">
          <BtnElButton
            ref="pressHandleRef"
            type="primary" class="group tracking-0.1em hover:shadow"
            :class="{ 'is-chating': isChating }"
            style="padding: 0.8rem 3rem;"
            round
            size="small"
          >
            <i i-solar:soundwave-line-duotone class="icon" p-2.5 />
            <div class="text w-5rem truncate text-center transition-width group-hover:(w-6rem sm:w-9rem) sm:w-8rem">
              <span class="chating-hidden">{{ isChating ? `正在输入 ${second}s` : (setting.isMobileSize ? '语音' : '语音 Ctrl+T') }}</span>
              <span hidden class="chating-show">停止录音 {{ second ? `${second}s` : '' }}</span>
            </div>
          </BtnElButton>
        </div>
        <div v-show="chat.msgForm.msgType === MessageType.SOUND && theAudioFile?.id" class="absolute-center-x">
          <i p-2.4 />
          <BtnElButton
            type="primary"
            class="group tracking-0.1em op-60 hover:op-100" :class="{ 'is-chating !op-100': isPalyAudio }"
            style="padding: 0.8rem 3rem;" round size="small"
            @click="handlePlayAudio(isPalyAudio ? 'stop' : 'play', theAudioFile?.id)"
          >
            {{ second ? `${second}s` : '' }}
            <i :class="isPalyAudio ? 'i-solar:stop-bold' : 'i-solar:play-bold'" class="icon" ml-2 p-1 />
          </BtnElButton>
          <i
            i-solar:trash-bin-minimalistic-broken ml-3 p-2.4 btn-danger
            @click="handlePlayAudio('del')"
          />
        </div>
        <div v-show="chat.msgForm.msgType !== MessageType.SOUND" class="grid cols-4 items-center gap-4 sm:flex">
          <!-- 图片 -->
          <InputOssFileUpload
            ref="inputOssImgUploadRef"
            v-model="imgList"
            :multiple="true"
            :preview="false"
            :size="setting.systemConstant.ossInfo?.image?.fileSize"
            :min-size="1024"
            :limit="9"
            :disable="isDisabledFile"
            class="i-solar:album-line-duotone h-6 w-6 cursor-pointer sm:(h-5 w-5) btn-primary"
            pre-class="hidden"
            :upload-type="OssFileType.IMAGE"
            input-class="op-0 h-6 w-6 sm:(w-5 h-5) cursor-pointer "
            :upload-quality="0.5"
            @error-msg="(msg:string) => {
              ElMessage.error(msg)
            }"
            @submit="onSubmitImg"
          />
          <!-- 视频 -->
          <InputOssFileUpload
            ref="inputOssVideoUploadRef"
            v-model="videoList"
            :multiple="false"
            :size="setting.systemConstant.ossInfo?.video?.fileSize"
            :min-size="1024"
            :preview="false"
            :limit="1"
            :disable="isDisabledFile"
            class="i-solar:video-library-line-duotone h-6 w-6 cursor-pointer sm:(h-5 w-5) btn-primary"
            pre-class="hidden"
            :upload-type="OssFileType.VIDEO"
            input-class="op-0 h-6 w-6 sm:(w-5 h-5) cursor-pointer "
            accept=".mp4,.webm,.mpeg,.flv"
            @error-msg="(msg:string) => {
              ElMessage.error(msg)
            }"
            @submit="onSubmitVideo"
          />
          <!-- 文件 -->
          <InputOssFileUpload
            ref="inputOssFileUploadRef"
            v-model="fileList"
            :multiple="false"
            :size="setting.systemConstant.ossInfo?.file?.fileSize"
            :min-size="1024"
            :preview="false"
            :limit="1"
            :disable="isDisabledFile"
            class="i-solar-folder-with-files-line-duotone h-6 w-6 cursor-pointer sm:(h-5 w-5) btn-primary"
            pre-class="hidden"
            :upload-type="OssFileType.FILE"
            input-class="op-0 h-6 w-6 sm:(w-5 h-5) cursor-pointer "
            :accept="FILE_UPLOAD_ACCEPT"
            @error-msg="(msg:string) => {
              ElMessage.error(msg)
            }"
            @submit="onSubmitFile"
          />
        </div>
        <i ml-a block w-0 />
        <!-- 群通知消息 -->
        <div
          v-if="isLord"
          title="群通知消息"
          class="i-carbon:bullhorn inline-block p-3.2 transition-200 btn-primary sm:p-2.8"
          @click="showGroupNoticeDialog = true"
        />
        <!-- 语音通话 -->
        <div
          v-if="isSelfRoom"
          title="语音通话"
          class="i-solar:phone-calling-outline p-3 transition-200 btn-primary sm:p-2.8"
          @click="chat.openRtcCall(chat.theContact.roomId, CallTypeEnum.AUDIO)"
        />
        <!-- 视频通话 -->
        <div
          v-if="isSelfRoom"
          title="视频通话"
          class="i-solar:videocamera-record-line-duotone p-3.2 transition-200 btn-primary sm:p-2.8"
          @click="chat.openRtcCall(chat.theContact.roomId, CallTypeEnum.VIDEO)"
        />
      </div>
      <!-- 内容 -->
      <el-form-item
        v-if="chat.msgForm.msgType !== MessageType.SOUND"
        prop="content"
        class="input relative h-fit w-full !m-(b-2 t-4) sm:mt-0"
        :class="{
          'is-mobile': setting.isMobileSize,
        }"
        style="padding: 0;margin:  0;"
        :rules="[
          { min: 1, max: 500, message: '长度在 1 到 500 个字符', trigger: `change` },
        ]"
      >
        <el-mention
          v-if="loadInputDone"
          ref="inputAllRef"
          v-model.lazy="chat.msgForm.content"
          :options="isReplyAI ? aiOptions : userAtOptions"
          :prefix="isReplyAI ? ['/'] : ['@']"
          popper-class="at-select border-default"
          :check-is-whole="(pattern: string, value: string) => isReplyAI ? checkAiReplyWhole(chat.msgForm.content, pattern, value) : checkAtUserWhole(chat.msgForm.content, pattern, value)"
          :rows="setting.isMobileSize ? 1 : 6"
          :maxlength="500"
          :placeholder="chat.theContact.hotFlag ? '/ 唤起AI助手' : ''"
          :autosize="setting.isMobileSize"
          type="textarea"
          resize="none"
          :class="{
            focused: chat.msgForm.content,
          }"
          placement="top"
          autofocus
          show-word-limit
          whole
          :offset="10"
          :popper-options="{
            placement: 'top-start',
          }"
          @paste.stop="onPaste($event)"
          @keydown.exact.enter.stop.prevent="onSubmit()"
          @keydown.exact.arrow-up.stop.prevent="onInputExactKey('ArrowUp')"
          @keydown.exact.arrow-down.stop.prevent="onInputExactKey('ArrowDown')"
        >
          <template #label="{ item }">
            <div class="h-full w-10em flex items-center pr-1" :title="item.label">
              <CardElImage class="h-6 w-6 rounded-full border-default" :src="BaseUrlImg + item.avatar" />
              <span class="ml-2 flex-1 truncate">{{ item.label }}</span>
            </div>
          </template>
          <!-- <template #header>
            <span ml-2 op-70>
              {{ isReplyAI ? 'AI机器人' : '群成员' }}
            </span>
          </template> -->
        </el-mention>
        <BtnElButton
          v-if="setting.isMobileSize"
          :disabled="!user.isLogin || isSending || isNotExistOrNorFriend"
          type="primary"
          style="height: 2.2rem !important;"
          class="mb-1px ml-2 mr-2 w-4.5rem"
          :loading="isBtnLoading"
          @click="onSubmit()"
        >
          发送
        </BtnElButton>
      </el-form-item>
      <!-- 录音 -->
      <p
        v-if="chat.msgForm.msgType === MessageType.SOUND"
        class="relative mt-2 h-fit w-full flex-row-c-c flex-1 overflow-y-auto p-4 text-wrap sm:p-6 text-small"
      >
        {{ (isChating && speechRecognition.isSupported || theAudioFile?.id) ? (audioTransfromText || '...') : `识别你的声音 🎧${speechRecognition.isSupported ? '' : '（不支持）'}` }}
      </p>
      <div
        v-if="!setting.isMobileSize"
        class="hidden items-end p-1 pt-0 sm:flex"
      >
        <div class="tip ml-a hidden sm:block text-mini">
          Enter发送, Shift+Enter换行
        </div>
        <BtnElButton
          :disabled="!user.isLogin || isSending || isNotExistOrNorFriend"
          class="group ml-a overflow-hidden tracking-0.2em shadow sm:ml-2"
          type="primary"
          round
          icon-class="i-solar:chat-line-bold mr-1.5"
          size="small"
          :loading="isBtnLoading"
          style="padding: 0.8rem;width: 6rem;"
          @click="onSubmit()"
        >
          发送&nbsp;
        </BtnElButton>
      </div>
      <div
        v-show="isNotExistOrNorFriend"
        class="absolute left-0 top-0 h-full w-full flex-row-c-c border-0 border-t-1px tracking-2px shadow backdrop-blur-4px border-default"
      >
        <span op-80>
          <i i-solar:adhesive-plaster-bold-duotone mr-3 p-2.4 />
          {{ SelfExistTextMap[chat.theContact.type] }}
        </span>
      </div>
    </div>
  </el-form>
  <ChatGroupNoticeMsgDialog v-model:show="showGroupNoticeDialog" @submit="onSubmitGroupNoticeMsg" />
</template>

<style lang="scss" scoped>
.form-tools {
    --at-apply: "flex flex-col justify-center p-2 border-default-t";
    .tip {
    --at-apply: "op-0";
  }
  &:hover {
    .tip {
      --at-apply: "op-100";
    }
  }
}
.at-select {
  :deep(.el-select__wrapper),
  :deep(.el-select-v2__input-wrapper),
  :deep(.el-input__wrapper) {
    box-shadow: none !important;
    background-color: transparent;
    padding: 0;
  }
  :deep(.el-form-item__error) {
    padding-left: 1rem;
  }
}
:deep(.el-form-item__content) {
  padding: 0;
}

.input {
  :deep(.el-form-item__content) {
    display: flex;
    align-items: end;
    .el-mention {
      width: auto;
      flex: 1;
    }
  }
  :deep(.el-input__count) {
    left: 0.8em;
    bottom: -3.5em;
    width: fit-content;
    background-color: transparent;
    transition: opacity 0.2s;
    opacity: 0;
  }
  :deep(.el-text__inner),
  :deep(.el-textarea__inner) {
    resize:none;
    box-shadow: none !important;
    background-color: transparent;
    caret-color: var(--el-color-primary);
    font-size: 1rem;
    &:hover + .el-input__count  {
      opacity: 1;
    }
    &::-webkit-input-placeholder {
      font-size: 0.9em;
      line-height: 1.7em;
    }
  }
  :deep(.el-input) {

    --at-apply: "p-2";
    .el-input__wrapper {
      box-shadow: none !important;
      outline: none !important;
      --at-apply: "bg-color-2";
    }
    .el-input__suffix {
      display: none !important;
    }
    .el-input-group__append {
      border: none;
      outline: none;
      box-shadow: none;
      --at-apply: "w-5em card-rounded-df px-4 ml-2 text-center bg-[var(--el-color-primary)] text-white text-center ";
    }
  }

  &.is-mobile {
    :deep(.el-form-item__content) {
      .el-input__count {
        left: auto;
        right: 1.2em;
        bottom: 0.8em;
      }
      .el-textarea {
        padding-left: 0.6em;
        .el-textarea__inner {
          min-height: 2.2rem !important;
          --at-apply: "bg-light-900 dark:bg-[#111111] shadow-lg shadow-inset";
        }
      }
    }
  }
}

// 语音
.is-chating {
  --at-apply: "shadow ";
  --shadow-color: var(--el-color-primary);
  --shadow-color2: var(--el-color-primary-light-3);
  outline: none !important;
  background-size: 400% 400%;
  transition: all 0.2s;
  animation: aniamte-poppup-pluse 1s linear infinite;
  background-image: linear-gradient(to right, var(--shadow-color2) 0%, var(--shadow-color) 50%,var(--shadow-color2) 100%);
  background-color: var(--shadow-color);
  border-color: var(--shadow-color);
  &:deep(.el-button) {
    outline: none !important;
  }
  &:hover .chating-hidden {
    --at-apply: "hidden";
  }
  &:hover .chating-show {
    --at-apply: "inline-block";
  }
  .icon {
    --at-apply: "animate-pulse";
  }
  .text {
    --at-apply: "!w-8rem";
  }
  &:hover {
    --at-apply: "shadow-md";
    --shadow-color: var(--el-color-danger);
    --shadow-color2: var(--el-color-danger-light-3);
    box-shadow: 0 0 0.8rem var(--shadow-color);
    animation-play-state: paused;
    background-color: var(-shadow-color);
    border-color: var(-shadow-color);
  }
}

@keyframes aniamte-poppup-pluse {
  0% {
    box-shadow: 0 0 0.5rem var(--shadow-color);
    background-position: 0% 50%;
  }
  50% {
    box-shadow: 0 0 1.2rem var(--shadow-color);
    background-position: 100% 50%;
  }
  100% {
    box-shadow: 0 0 0.5rem var(--shadow-color);
    background-position: 0% 50%;
  }
}

.play-btn {
  background-color: #7e7e7e7a;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
  --at-apply: "text-white  border-(2px solid #ffffff) bg-(gray-5 op-30) backdrop-blur-3px";
  .bg-blur {
    --at-apply: " bg-(gray-5 op-30) backdrop-blur";
  }
}
</style>
