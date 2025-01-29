<script setup lang="ts">
import { appKeywords, appName } from "@/constants/index";
import { WsStatusEnum } from "~/types/chat/WsType";

useSeoMeta({
  title: `极物AI - ${appName}`,
  description: `${appName} - 极物聊天 开启你的极物之旅！`,
  keywords: appKeywords,
});
const setting = useSettingStore();
const user = useUserStore();

const INIT_MSG = {
  fromUser: {
    userId: "1739333818150862850",
    avatar: "image/2023-12-27/1653240351484801026/fab3eab2-e721-4e82-a98f-0bdbdb6e0068",
    gender: Gender.DEFAULT,
    nickName: "极物AI客服",
  },
  message: {
    id: 1,
    roomId: 0,
    sendTime: Date.now(),
    content: "你好！欢迎光临极物聊天，有什么可以帮您的吗？",
    type: MessageType.AI_CHAT,
    body: {
    },
  },
};


const scollRef = useTemplateRef("scollRef");
const formRef = useTemplateRef("formRef");
const inputRef = useTemplateRef("inputRef");
const msgList = useLocalStorage<ChatMessageVO[]>(`ai_chat_history_${user.userInfo.id}`, []);
const status = ref<WsStatusEnum>(WsStatusEnum.CLOSE);
const isChat = computed(() => status.value === WsStatusEnum.OPEN);// 是否在返回数据
const form = ref({
  role: "user",
  content: "",
});

const body = ref({
  ws: null as WebSocket | null,
});

const dto = ref({
  header: {
    app_id: XUN_FEI_APP_ID,
    uid: user.userInfo.id,
  },
  parameter: {
    chat: {
      domain: "general",
      temperature: 0.8,
      top_k: 4,
      max_tokens: 2048,
    },
  },
  payload: {
    message: {
      text: [{
        role: "user",
        content: "",
      }],
    },
  },
});

function onSubmit() {
  if (status.value === WsStatusEnum.OPEN || !form.value.content || form.value.content.length < 1 || isChat.value)
    return;

  formRef.value?.validate((action: boolean) => {
    if (!action)
      return;
    sendMsg(form.value.content, user.userInfo.id);
    form.value.content = "";
  });
}

function onStop() {
  if (status.value === WsStatusEnum.OPEN)
    return;
  body.value.ws?.close();
  scrollBottom();
  status.value = WsStatusEnum.SAFE_CLOSE;
}

function sendMsg(msg: string, id: string) {
  if (body.value.ws && body.value.ws.OPEN === 1)
    return;
  body.value.ws = new WebSocket(XUN_FEI_WSS_URL);
  body.value.ws.onopen = async (e) => {
    status.value = WsStatusEnum.OPEN;
    if (dto?.value?.payload?.message?.text?.[0])
      dto.value.payload.message.text[0].content = msg;
    dto.value.header.uid = id;
    body.value.ws?.send(JSON.stringify(dto.value));
    await nextTick();
    scrollBottom();
  };
  body.value.ws.onclose = async () => {
    setTimeout(() => {
      status.value = WsStatusEnum.SAFE_CLOSE;
    }, 300);
    body.value.ws = null;
    await nextTick();
    scrollBottom();
    inputRef.value?.focus();
  };
  body.value.ws.onerror = () => {
    body.value.ws = null;
    setTimeout(async () => {
      status.value = WsStatusEnum.CLOSE;
      await nextTick();
      scrollBottom();
      inputRef.value?.focus();
    }, 300);
  };
  body.value.ws.onmessage = (e) => {
    if (e.data) {
      const data = JSON.parse(e.data);
      status.value = WsStatusEnum.OPEN;
      // status.value = data.payload.status as WsStatusEnum;
      const text = data?.payload?.choices?.text || [];
      text.value = "";
      text.forEach((p: any) => {
        if (p && p.role === "assistant")
          text.value += p.content;
      });
      const theMsg = msgList.value.find(p => p.message.id === data?.header?.sid);
      if (theMsg) {
        theMsg.message.content += text.value;
        return;
      }
      msgList.value.push({
        fromUser: {
          userId: "1739333818150862850",
          avatar: "image/2023-12-27/1653240351484801026/fab3eab2-e721-4e82-a98f-0bdbdb6e0068",
          gender: Gender.DEFAULT,
          nickName: "极物AI客服",
        },
        message: {
          id: data.header.sid,
          roomId: 0,
          sendTime: Date.now(),
          content: text.value,
          type: MessageType.AI_CHAT,
          body: {
          },
        },
      });
      scrollBottom();
    }
  };
  msgList.value.push({
    fromUser: {
      userId: user.userInfo.id,
      avatar: user.userInfo.avatar,
      gender: user.userInfo.gender,
      nickName: user.userInfo.nickname,
    },
    message: {
      id: Date.now(),
      roomId: 0,
      sendTime: Date.now(),
      content: msg,
      type: MessageType.TEXT,
      body: {
      },
    },
  });
}

// 滚动到底部
function scrollBottom(animate = true) {
  if (!scollRef.value?.wrapRef?.scrollTo) {
    return;
  }
  if (animate) {
    scollRef.value?.wrapRef?.scrollTo({
      top: scollRef?.value?.wrapRef?.scrollHeight + 20 || 0,
      behavior: "smooth",
    });
  }
  else {
    scollRef.value?.setScrollTop(scollRef?.value?.wrapRef?.scrollHeight + 20 || 0);
  }
}

function handleNewChat() {
  if (isChat.value)
    return ElMessage.warning("正在聊天中，请先结束当前对话！");

  // 开启新对话
  body.value.ws?.close();
  body.value.ws = null;
  status.value = WsStatusEnum.CLOSE;
  msgList.value = [INIT_MSG];
  nextTick(() => {
    scrollBottom(false);
  });
}

function active() {
  if (!setting.isMobileSize)
    inputRef.value?.focus();

  if (msgList.value.length === 0)
    msgList.value.push(INIT_MSG);

  nextTick(() => {
    scrollBottom(false);
  });
}

onMounted(() => active());
onActivated(() => active());
</script>

<template>
  <div class="flex flex-1 flex-col sm:(px-4 pb-4)">
    <!-- header -->
    <p class="my-4 pl-4 text-[var(--el-color-primary)] font-600 tracking-0.2em sm:pl-0">
      <i class="i-solar:ghost-bold mr-2 p-0.8em" />
      极物AI
    </p>
    <!-- 内容 -->
    <el-scrollbar ref="scollRef" view-class="h-full p-2 md:p-4" class="relative sm:card-rounded-df shadow shadow-inset bg-color-2">
      <!-- 消息适配器 -->
      <div class="pb-24">
        <ChatMsgMain
          v-for="(msg, i) in msgList" :id="`chat-msg-${msg.message.id}`"
          :key="msg.message.id"
          :index="i"
          :data="msg"
          :prev-msg="i > 0 ? msgList[i - 1] : undefined"
        />
      </div>
      <div class="form">
        <el-form
          ref="formRef"
          data-fade
          class="form-wrapper"
          :model="form"
          @submit.prevent="onSubmit"
        >
          <div class="group relative h-2rem w-2rem shrink-0">
            <CardElImage
              :src="user.userInfo.avatar ? BaseUrlImg + user.userInfo.avatar : ''"
              class="h-full w-full cursor-pointer rounded-1/2 shadow"
            />
            <div
              class="h-full w-full flex-row-c-c rounded-full op-0 transition-opacity absolute-center-center btn-primary-text bg-color-br group-hover:op-100 border-default-hover"
              @click="handleNewChat"
            >
              <el-tooltip content="新对话" placement="top">
                <i i-carbon:add p-3 />
              </el-tooltip>
            </div>
          </div>
          <el-form-item
            prop="content" class="w-full" :rules="[{
              required: true,
              message: '',
              trigger: 'change',
            }]"
            style="margin: 0;padding: 0;"
          >
            <el-input
              ref="inputRef"
              v-model.lazy="form.content"
              type="textarea"
              :row="1"
              :maxlength="2048"
              :minlength="1"
              resize="none"
              :autosize="true"
              style="max-height: 16em;overflow-y: auto;"
              :disabled="isChat" placeholder="快开始对话吧 ✨"
              class="content card-rounded-df"
              @keydown.enter.prevent="onSubmit"
            />
          </el-form-item>
          <BtnElButton
            class="group ml-a"
            :class="isChat ? 'animate-pulse' : ''"
            :icon-class="`hidden sm:block mr-1 ${isChat ? 'i-solar:menu-dots-bold-duotone ' : 'i-solar:map-arrow-right-bold-duotone'}`"
            :type="isChat ? 'danger' : 'info'"
            @click="isChat ? onStop() : onSubmit()"
          >
            {{ isChat ? "结束" : "发送" }}&nbsp;
          </BtnElButton>
        </el-form>
      </div>
    </el-scrollbar>
  </div>
</template>

<style lang="scss" scoped>
// .content {
//   // :deep(.el-input__wrapper) {
//   //   background-color: transparent;
//   //   border: 1px solid transparent;
//   //   border-radius: 2rem;
//   //   padding: 0 1em;
//   //   box-shadow: none !important;

//   //   &.is-focus,
//   //   &:hover,
//   //   &.is-error {
//   //     box-shadow: transparent !important;
//   //     border-bottom: 1px solid #88888811;
//   //   }
//   // }
// }
.form {
  --at-apply: "absolute bottom-0 w-full left-0 sm:p-4 p-2";
  .form-wrapper {
    --at-apply: "flex border-default-2 items-end gap-2 p-4  sm:gap-4 bg-color-br card-rounded-df";
  }
  :deep(.content.el-textarea) {
    .el-textarea__inner {
      box-shadow: none !important;
      outline: none !important;
      border-radius: inherit;
      --at-apply: "bg-color-2";
    }
  }
}
</style>
