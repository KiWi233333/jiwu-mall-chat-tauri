<script lang="ts" setup>
import ContextMenu from "@imengyu/vue3-context-menu";


const emit = defineEmits<{
  (e: "submit", newMsg: ChatMessageVO): void
}>();
// function getRoleMap(type: ChatRoomRoleEnum) {
//   return ChatRoomRoleEnumMap[type] || "";
// }
const user = useUserStore();
const chat = useChatStore();

// 表单
const form = ref<ChatMessageDTO>({
  roomId: chat.theContact.roomId,
  msgType: MessageType.TEXT, // 默认
  content: "",
  body: {
  },
});
const inputRef = ref(); // 输入框
watch(() => chat.replyMsg?.message?.id, (val) => {
  form.value.body.replyMsgId = val;
  nextTick(() => {
    if (inputRef.value)
      inputRef.value?.focus(); // 聚焦
  });
});


// 文件上传（图片）
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


// 是否在返回数据
const formRef = ref();
const isSend = ref(false);
// 发送消息
function onSubmit() {
  if (isSend.value)
    return;

  form.value.content = form.value.content?.trim().replace(/\n$/g, "");
  if (!form.value.content?.trim()) {
    ElMessage.warning("不能发送空白消息！");
    return;
  }
  formRef.value?.validate(async (action: boolean) => {
    if (form.value.msgType === MessageType.TEXT && (!form.value.content || form.value.content?.trim().length > 500))
      ElMessage.error("消息内容不能超过500字！");
    if (!action)
      return;

    isSend.value = true;
    const res = await addChatMessage({
      ...form.value,
      roomId: chat.theContact.roomId,
    }, user.getToken);
    isSend.value = false;
    if (res.code === StatusCode.SUCCESS)
      emit("submit", res.data);
    else if (res.message === "您和对方已不是好友！")
      return;
    form.value.content = "";
    reloadForm();
  });
}

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
  const url = await inputOssFileUploadRef.value?.onUpload({
    id: URL.createObjectURL(file),
    key: undefined,
    status: "",
    percent: 0,
    file,
  });
  form.value.msgType = MessageType.IMG; // 图片
}

// 房间号变化
let timer: any = 0;
watch(() => chat.theContact.roomId, () => {
  reloadForm();
  if (inputRef.value)
    inputRef.value?.focus(); // 聚焦
});
onUnmounted(() => {
  clearTimeout(timer);
  clearInterval(timer);
  timer = null;
});

// 重置表单
function reloadForm() {
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
}
watch(() => chat.theContact.roomId, () => {
  reloadForm();
  loadUser();
});

// 到底部
function setReadAll() {
  if (chat.theContact.roomId) {
    chat.setReadList(chat.theContact.roomId);
    chat.scrollBottom();
  }
}

// 右键菜单
const colorMode = useColorMode();
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


const isDisabled = computed(() => !user?.isLogin || chat.theContact.selfExist === 0);
const isNoExist = computed(() => chat.theContact.selfExist === 0);

// @用户
const atSelectRef = ref();
const userList = ref<ChatMemberVO[]>([]);
async function loadUser() {
  if (!chat.theContact.roomId || chat.theContact.type !== RoomType.GROUP)
    return;
  const { data } = await getRoomGroupAllUser(chat.theContact.roomId, user.getToken);
  if (data.value && data.value.code === StatusCode.SUCCESS)
    userList.value = data.value?.data || [];
}
watch(() => chat.atUserList, (val) => {
  form.value.body.atUidList = val || [];
}, { deep: true, immediate: true });

// 未读数
const theRoomUnReadLength = computed(() => {
  return chat.theContact.unReadLength;
});

const SelfExistTextMap = {
  [RoomType.SELFT]: "已经不是好友",
  [RoomType.GROUP]: "已经不是群成员",
  [RoomType.AICHAT]: "已经被AI拉黑",
};

// 挂载
onMounted(() => {
  // 加载用户
  loadUser();
});
</script>

<template>
  <el-form
    ref="formRef"
    :model="form"
    :disabled="isDisabled"
    class="w-full"
    style="position: relative;"
    @submit.prevent="onSubmit"
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
        style="padding: 0 0.5rem;margin:0;margin-bottom:0.4rem;display: flex;width:fit-content;justify-content: center;
        grid-gap:0.2rem;
        margin-left: auto;"
      >
        <CardElImage
          v-for="(img, i) in imgList" :key="i"
          preview-teleported
          loading="lazy"
          :preview-src-list="[img.id || BaseUrlImg + img.key]"
          :src="img.id || BaseUrlImg + img.key"
          class="ml-a h-8rem w-8rem overflow-hidden rounded-6px p-2 border-default card-default"
          @contextmenu="onContextMenu($event, img.key, i)"
        />
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
          <div class="i-solar:close-circle-bold text-dark op-80 transition-200 transition-color btn-default dark:text-light hover:text-[var(--el-color-danger)]" h-2em w-2em @click="chat.setReplyMsg({})" />
        </div>
      </el-form-item>
    </div>
    <div class="flex flex-col border-0 border-t-1px px-4 py-2 shadow border-default bg-color">
      <!-- 工具栏 -->
      <div
        class="relative flex grid-gap-4"
      >
        <!-- @R艾特 群聊可用 -->
        <el-form-item
          v-if="chat.theContact.type === RoomType.GROUP"
          :disabled="form.msgType !== MessageType.TEXT"
          style="padding: 0;margin: 0;"
          prop="body.atUidList"
          class="at-select w-12rem"
        >
          <el-select
            ref="atSelectRef"
            v-model="chat.atUserList"
            :disabled="form.msgType !== MessageType.TEXT"
            :max="20"
            :max-collapse-tags="1"
            :clearable="false"
            ilterable
            collapse-tags multiple default-first-option :reserve-keyword="true"
            placeholder="@其他人"
            @change="(val) => chat.atUserList = val"
          >
            <el-option
              v-for="p in userList"
              :key="p.userId"
              :value="p.userId"
              :label="`@${p.nickName}`"
            />
          </el-select>
        </el-form-item>
        <!-- 图片 -->
        <el-form-item
          style="cursor: pointer; padding: 0;margin: 0;"
          prop="body.url"
          class="cursor-pointer"
        >
          <InputOssFileUpload
            ref="inputOssFileUploadRef"
            v-model="imgList"
            :multiple="false"
            :preview="false"
            :limit="1"
            :disable="isDisabled"
            class="i-solar:album-line-duotone h-1.5rem w-1.5rem cursor-pointer"
            :upload-type="OssFileType.IMAGE"
            input-class="op-0 h-1.5rem w-1.5rem cursor-pointer "
            :upload-quality="0.5"
            @error-msg="(msg:string) => {
              ElMessage.error(msg)
            }"
            @submit="onSubmitImg"
          />
        </el-form-item>
        <!-- 滚动底部 -->
        <div
          class="ml-a w-fit flex-row-c-c px-2 transition-200 btn-primary"
          @click="chat.scrollBottom()"
        >
          <i i-solar:double-alt-arrow-down-line-duotone p-3 />
        </div>
      </div>
      <!-- 内容 -->
      <div relative my-2 flex items-end gap-3>
        <el-form-item
          prop="content"
          style="padding: 0;margin: 0;"
          class="w-full"
          :rules="[
            { min: 1, max: 500, message: '长度在 1 到 500 个字符', trigger: `change` },
          ]"
        >
          <el-input
            ref="inputRef"
            v-model.lazy="form.content"
            :rows="6"
            show-word-limit
            :maxlength="500"
            :autosize="false"
            type="textarea"
            class="input"
            autofocus
            :class="{
              focused: form.content,
            }"
            @paste="onPaste"
            @keydown.enter.prevent="onSubmit"
          />
        </el-form-item>
        <BtnElButton
          :disabled="!user.isLogin"
          transition-icon
          class="group absolute ml-a shadow -bottom-1 -right-1"
          icon-class="i-solar:map-arrow-right-bold-duotone block -rotate-45 mr-1"
          type="info"
          @click="onSubmit()"
        >
          发送&nbsp;
        </BtnElButton>
      </div>
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
    border-radius: 1rem;
  }
  :deep(.el-form-item__error) {
    padding-left: 1rem;
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
</style>
