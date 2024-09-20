<script lang="ts" setup>
import ContextMenu from "@imengyu/vue3-context-menu";
import { checkAtUserWhole, useAtUsers, useLoadAtUserList, useRecording } from "~/composables/hooks/useChat";
import { useLinterFileDrop } from "~/composables/hooks/useFileDrop";

const emit = defineEmits<{
  (e: "submit", newMsg: ChatMessageVO): void
}>();
// store
const user = useUserStore();
const chat = useChatStore();

// hooks
const {
  isChating,
  second, // 获取录音时间
  theAudioFile,
  speechRecognition,
  audioTransfromText,
  isPalyAudio,
  toggle: toggleChating, // 开始/停止录音
  reset: resetAudio,
  handlePlayAudio, // 播放录音
} = useRecording();

// 表单
const form = ref<ChatMessageDTO>({
  roomId: chat.theContact.roomId,
  msgType: MessageType.TEXT, // 默认
  content: "",
  body: {
  },
});
const inputAllRef = ref(); // 输入框
const formRef = ref();
const isSending = ref(false);
const isDisabled = computed(() => !user?.isLogin || chat.theContact.selfExist === 0);
const isNoExist = computed(() => chat.theContact.selfExist === 0); // 自己不存在

// 读取@用户列表 hook
const { userOptions, userOpenOptions, loadUser } = useLoadAtUserList();
watch(() => chat.atUidListTemp, (val) => {
  if (val.length) {
    form.value.content += val.map((uid) => {
      const user = userOptions.value.find(u => u.userId === uid);
      return user ? `@${user.nickName}(#${user.username}) ` : "";
    }).join("");
    inputAllRef.value?.input?.focus(); // 聚焦
    chat.atUidListTemp.splice(0);
  }
}, { deep: true });

// 未读数
const theRoomUnReadLength = computed(() => {
  return chat.theContact.unReadLength;
});
const SelfExistTextMap = {
  [RoomType.SELFT]: "已经不是好友",
  [RoomType.GROUP]: "已经不是群成员",
  [RoomType.AICHAT]: "已经被AI拉黑",
};
// 右键菜单
const colorMode = useColorMode();

// 文件上传（图片）回调
const inputOssFileUploadRef = ref();
const imgList = ref<OssFile[]>([]);
function onSubmitImg(key: string, pathList: string[], fileList: OssFile[]) {
  const file = imgList.value.find(f => f.key === key);
  if (key && file?.file) {
    const url = window.URL || window.webkitURL;
    let width = 0;
    let height = 0;
    const img = new Image(); // 手动创建一个Image对象
    img.src = url.createObjectURL(file?.file);// 创建Image的对象的url
    img.onload = function () {
      width = img.width || 0;
      height = img.height || 0;
    };
    form.value = {
      roomId: chat.theContact.roomId,
      msgType: MessageType.IMG, // 图片
      content: form.value.content,
      body: {
        url: key,
        width,
        height,
        size: file?.file?.size,
      },
    };
  }
}

// 语音
onMounted(() => {
  // 监听快捷键
  window.addEventListener("keydown", startChating);
});
onUnmounted(() => {
  window.removeEventListener("keydown", startChating);
});
// 开始录音
async function startChating(e: KeyboardEvent) {
  if (e.key === "t" && e.ctrlKey && !isChating.value) {
    e.preventDefault();
    isChating.value = true;
    form.value.msgType = MessageType.SOUND; // 语音
  }
  else if (e.key === "c" && e.ctrlKey && isChating.value) {
    e.preventDefault();
    isChating.value = false;
    form.value.msgType = MessageType.SOUND; // 语音
  }
}

const isUploadImg = computed(() => form.value.msgType === MessageType.IMG && !!imgList?.value?.filter(f => f.status !== "success")?.length);
/**
 * 粘贴图片上传
 * @param e 事件对象
 */
async function onPaste(e: ClipboardEvent) {
  // 判断粘贴上传图片
  if (!e.clipboardData?.items?.length)
    return;
  // 拿到粘贴板上的 image file 对象
  const file = Array.from(e.clipboardData.items)
    .find(v => v.type.includes("image"))
    ?.getAsFile();

  if (!file || !inputOssFileUploadRef.value)
    return;
  if (isUploadImg.value) {
    ElMessage.warning("图片正在上传中，请稍后再试！");
    return;
  }
  inputOssFileUploadRef.value.resetInput?.();
  imgList.value = [];
  await inputOssFileUploadRef.value?.onUpload({
    id: URL.createObjectURL(file),
    key: undefined,
    status: "",
    percent: 0,
    file,
  });
  form.value.msgType = MessageType.IMG; // 图片
}

/**
 * 发送消息
 */
async function onSubmit(e?: KeyboardEvent) {
  if (e) {
    // 上下键
    if (!form?.value?.content?.trim() && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      chat.onDownUpChangeRoom(e.key === "ArrowDown" ? "down" : "up");
      return;
    }
    if (e?.shiftKey && e?.key === "Enter")
      return;
    if (e?.key !== "Enter")
      return;
    e.preventDefault && e.preventDefault();
    e.stopPropagation && e.stopPropagation();
  }
  if (isSending.value)
    return;
  formRef.value?.validate(async (action: boolean) => {
    if (!action)
      return;
    if (form.value.msgType === MessageType.TEXT && (!form.value.content || form.value.content?.trim().length > 500))
      return;

    // 处理 @用户
    if (chat.theContact.type === RoomType.GROUP && form.value.content?.includes("@")) {
      const { uidList, atUidList } = useAtUsers(form.value.content, userOptions.value);
      chat.atUserList = [...atUidList];
      form.value.body.atUidList = [...new Set(uidList)];
      if (document.querySelector(".at-select")) // enter冲突at选择框
        return;
    }
    else {
      form.value.body.atUidList = [];
    }
    // 图片
    if (form.value.msgType === MessageType.IMG && isUploadImg.value) {
      ElMessage.warning("图片正在上传中，请稍后再试！");
      return;
    }

    // 开始提交
    isSending.value = true;
    // 二次处理
    if (form.value.msgType === MessageType.SOUND) {
      await onSubmitSound((key) => {
        form.value.body.url = key;
        form.value.body.translation = audioTransfromText.value;
        form.value.body.second = second.value;
        submit();
      });
      return;
    }
    // 普通消息
    submit();
  });
}


/**
 * 发送消息
 */
async function submit() {
  const res = await addChatMessage({
    ...form.value,
    roomId: chat.theContact.roomId,
  }, user.getToken);
  isSending.value = false;
  if (res.code === StatusCode.SUCCESS)
    emit("submit", res.data);
  else if (res.message === "您和对方已不是好友！")
    return;
  form.value.content = "";
  resetForm();
}

// 房间号变化
let timer: any = 0;
watch(() => chat.theContact.roomId, () => {
  resetForm();
  if (inputAllRef.value?.input)
    inputAllRef.value?.input?.focus(); // 聚焦
});
onUnmounted(() => {
  clearTimeout(timer);
  clearInterval(timer);
  timer = null;
});

// 回复消息
watch(() => chat.replyMsg?.message?.id, (val) => {
  form.value.body.replyMsgId = val;
  nextTick(() => {
    if (inputAllRef.value?.input)
      inputAllRef.value?.input?.focus(); // 聚焦
  });
});

// 到底部并消费消息
function setReadAll() {
  if (chat.theContact.roomId) {
    chat.setReadList(chat.theContact.roomId);
    chat.scrollBottom();
  }
}

/**
 * 右键菜单
 * @param e 事件对象
 * @param key key
 * @param index 索引
 */
function onContextMenu(e: MouseEvent, key?: string, index: number = 0) {
  e.preventDefault();
  const opt = {
    x: e.x,
    y: e.y,
    theme: colorMode.preference === "dark" ? "mac dark" : "wind10",
    items: [
      {
        customClass: "group",
        icon: "i-solar:trash-bin-minimalistic-outline group-btn-danger",
        label: "删除图片",
        onClick: async () => {
          if (!key)
            return;
          const res = await deleteOssFile(key, user.getToken);
          ElMessage.closeAll("error");
          if (res.code === StatusCode.SUCCESS) {
            imgList.value.splice(
              index,
              1,
            );
          }
          else if (res.code === StatusCode.DELETE_ERR) {
            imgList.value.splice(
              index,
              1,
            );
          }
          inputOssFileUploadRef?.value.resetInput?.();
        },
      },
    ],
  };
  ContextMenu.showContextMenu(opt);
}

// 重置表单
function resetForm() {
  form.value = {
    roomId: chat.theContact.roomId,
    msgType: MessageType.TEXT, // 默认
    content: "",
    body: {
      atUidList: [],
    },
  };
  imgList.value = [];
  // store
  chat.atUserList.splice(0);
  chat.setReplyMsg({});
  resetAudio();
}
async function onSubmitSound(callback: (key: string) => void) {
  if (!theAudioFile.value || !theAudioFile.value.id)
    return ElMessage.error("请先录制语音");
  await useOssUpload(OssFileType.SOUND, theAudioFile.value, user.getToken, {
    callback(event, data, file) {
      if (event === "error")
        ElMessage.error("发送语音失败，请稍后再试！");
      else if (event === "success")
        callback(data);
    },
  });
}
watch(() => chat.theContact.roomId, () => {
  resetForm();
  loadUser();
});

// 监听文件拖拽事件
const { fileList: fileDropList } = await useLinterFileDrop();
</script>

<template>
  <el-form
    ref="formRef"
    :model="form"
    :disabled="isDisabled"
    class="w-full"
    style="position: relative;"
  >
    <div class="top absolute w-full p-2 -transform-translate-y-full" @click.prevent="() => {}">
      <!-- 新消息 -->
      <el-form-item
        v-show="theRoomUnReadLength"
        class="w-full cursor-pointer"
        style="padding: 0 0.5rem;margin:0;margin-bottom:0.4rem;display: flex;justify-content: right;"
        @click="setReadAll"
      >
        <el-tag type="warning" effect="light" round class="ml-a">
          有{{ theRoomUnReadLength }}条新消息
        </el-tag>
      </el-form-item>
      <!-- 图片 -->
      <el-form-item
        v-if="imgList.length > 0"
        class="w-full cursor-pointer"
        style="padding: 0 0.5rem;margin:0;margin-bottom:0.4rem;display: flex;width:fit-content;justify-content: center;gap: 0.5rem;grid-gap:4;margin-left: auto;"
      >
        <div v-for="(img, i) in imgList" :key="i" class="flex-row-c-c p-2 shadow-sm transition-all border-default card-default bg-color hover:shadow-lg">
          <CardElImage
            preview-teleported
            loading="lazy"
            :preview-src-list="[img.id || BaseUrlImg + img.key]"
            :src="img.id || BaseUrlImg + img.key"
            class="max-h-9rem max-w-16rem min-h-2rem w-16rem w-fit rounded p-0"
            title="左键放大 | 右键删除"
            @contextmenu="onContextMenu($event, img.key, i)"
          />
        </div>
      </el-form-item>
      <!-- 回复 -->
      <el-form-item
        v-if="chat.replyMsg?.fromUser"
        prop="body.replyMsgId"
        class="w-full"
        style="padding: 0.4rem;margin:0;margin-bottom:0.2rem;display: flex;"
      >
        <div class="w-full flex animate-[300ms_fade-in] items-center rounded-6px bg-[#ffffff9c] p-2 shadow backdrop-blur-10px border-default dark:bg-dark">
          <el-tag effect="dark" class="mr-2">
            回复
          </el-tag><ChatMsgContentCard class="w-4/5 truncate" :data="chat.replyMsg" />
          <div class="i-solar:close-circle-bold h-6 w-6 text-dark op-80 transition-200 transition-color btn-default dark:text-light hover:text-[var(--el-color-danger)]" @click="chat.setReplyMsg({})" />
        </div>
      </el-form-item>
    </div>
    <div class="flex flex-col justify-center border-0 border-t-1px p-2 shadow border-default bg-color">
      <!-- 工具栏 -->
      <div
        class="relative min-h-8 flex items-center gap-4 px-2"
      >
        <el-tooltip popper-style="padding: 0.2em 0.5em;" :content="form.msgType !== MessageType.SOUND ? '语音 Ctrl+T' : '键盘'" placement="top">
          <i
            :class="form.msgType !== MessageType.SOUND ? 'i-solar:microphone-3-broken hover:animate-pulse' : 'i-solar:keyboard-broken'"
            class="h-6 w-6 cursor-pointer btn-primary"
            @click="form.msgType = form.msgType === MessageType.TEXT ? MessageType.SOUND : MessageType.TEXT"
          />
        </el-tooltip>
        <div v-show="form.msgType !== MessageType.SOUND" class="flex items-center gap-4">
          <!-- 图片 -->
          <el-form-item
            style="cursor: pointer; padding: 0;margin: 0;"
            prop="body.url"
            class="cursor-pointer btn-primary"
          >
            <InputOssFileUpload
              ref="inputOssFileUploadRef"
              v-model="imgList"
              :multiple="false"
              :preview="false"
              :limit="1"
              :disable="isDisabled"
              class="i-solar:album-line-duotone h-5 w-5 cursor-pointer"
              pre-class="hidden"
              :upload-type="OssFileType.IMAGE"
              input-class="op-0 h-5 w-5 cursor-pointer "
              :upload-quality="0.5"
              @error-msg="(msg:string) => {
                ElMessage.error(msg)
              }"
              @submit="onSubmitImg"
            />
          </el-form-item>
        </div>
        <!-- 语音 -->
        <div v-show="form.msgType === MessageType.SOUND && !theAudioFile?.id" class="absolute-center-x">
          <BtnElButton
            type="primary"
            class="group tracking-0.1em hover:shadow-lg" :class="{ 'is-chating': isChating }"
            style="padding: 0.8rem 3rem;" round size="small"
            @click="toggleChating"
          >
            <i i-solar:soundwave-line-duotone class="icon" p-2.5 />
            <div w-8rem truncate transition-width class="text px-2 text-center group-hover:w-8rem">
              <span class="chating-hidden">{{ isChating ? `正在输入 ${second}s` : '语音 Ctrl+T' }}</span>
              <span hidden class="chating-show">停止录音 {{ second ? `${second}s` : '' }}</span>
            </div>
          </BtnElButton>
        </div>
        <div v-show="form.msgType === MessageType.SOUND && theAudioFile?.id" class="absolute-center-x">
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
          <span
            ml-4 btn-danger
            @click="handlePlayAudio('del')"
          >
            <i i-solar:trash-bin-minimalistic-broken p-2.4 />
          </span>
        </div>
        <!-- 滚动底部 -->
        <div
          class="ml-a w-fit flex-row-c-c transition-200 btn-primary"
          @click="chat.scrollBottom()"
        >
          <i i-solar:double-alt-arrow-down-line-duotone p-3 />
        </div>
      </div>
      <!-- 内容 -->
      <el-form-item
        v-if="form.msgType !== MessageType.SOUND"
        prop="content"
        style="padding: 0;margin: 0;"
        class="relative h-40 w-full"
        :rules="[
          { min: 1, max: 500, message: '长度在 1 到 500 个字符', trigger: `change` },
        ]"
      >
        <el-mention
          ref="inputAllRef"
          v-model.lazy="form.content"
          :options="userOpenOptions"
          :prefix="['@']"
          popper-class="at-select"
          :check-is-whole="(pattern, value) => checkAtUserWhole(form.content, pattern, value)"
          :rows="6"
          :maxlength="500"
          :autosize="false"
          type="textarea"
          resize="none"
          class="input"
          :class="{
            focused: form.content,
          }"
          placement="top"
          autofocus
          show-word-limit
          whole
          :offset="10"
          :popper-options="{
            placement: 'top-start',
          }"
          @paste.stop="onPaste"
          @keydown="(e: KeyboardEvent) => onSubmit(e)"
        >
          <template #label="{ item }">
            <div class="h-full flex items-center pr-1">
              <CardElImage class="h-6 w-6 rounded-full" :src="BaseUrlImg + item.avatar" />
              <span class="ml-2 inline-block max-w-10em truncate">{{ item.label }}</span>
            </div>
          </template>
          <template #header>
            <span ml-2 op-70>
              群成员
            </span>
          </template>
        </el-mention>
      </el-form-item>
      <!-- 录音 -->
      <p
        v-if="form.msgType === MessageType.SOUND"
        class="relative h-40 w-full flex-row-c-c overflow-hidden p-8 pt-2 text-wrap op-90"
      >
        {{ (isChating && speechRecognition.isSupported || theAudioFile?.id) ? (audioTransfromText || '...') : `识别你的声音 🎧${speechRecognition.isSupported ? '' : '（不支持）'}` }}
      </p>
      <BtnElButton
        :disabled="!user.isLogin || isSending"
        class="group bottom-2.5 right-2.5 ml-a overflow-hidden shadow !absolute"
        type="primary"
        round
        size="small"
        :loading="isSending || (form.msgType === MessageType.IMG && isUploadImg)"
        style="padding: 0.8rem;width: 6rem;"
        @click="onSubmit()"
      >
        发送&nbsp;
      </BtnElButton>
    </div>
    <div
      v-show="isNoExist"
      class="absolute left-0 top-0 h-full w-full flex-row-c-c border-0 border-t-1px tracking-2px shadow backdrop-blur-4px border-default"
    >
      <span op-80>
        <i i-solar:adhesive-plaster-bold-duotone mr-3 p-2.4 />
        {{ SelfExistTextMap[chat.theContact.type] }}
      </span>
    </div>
  </el-form>
</template>

<style lang="scss" scoped>
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
:deep(.el-mention-popper) {
  .el-mention-dropdown__header {
    padding: 0.2rem;
  }
  .el-mention-dropdown__item {
    padding: 0 0.4rem;
  }
}
.input {
  :deep(.el-input__count) {
    left: 0px;
    background-color: transparent;
    transition: opacity 0.2s;
    opacity: 0;
  }
  :deep(.el-textarea__inner) {
    resize:none;
    box-shadow: none !important;
    background-color: transparent;
    caret-color: var(--el-color-primary);
    font-size: 1rem;
    &:hover + .el-input__count  {
      opacity: 1;
    }
  }
}
// 语音
.is-chating {
  --at-apply: "shadow-lg ";
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
</style>
