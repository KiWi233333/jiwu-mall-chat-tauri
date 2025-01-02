<script setup lang="ts">
import { WsStatusEnum } from "~/composables/types/WsType";
import { XUN_FEI_APP_ID } from "~/composables/utils/useBaseUrl";
import { appKeywords } from "~/constants";

useSeoMeta({
  title: "极物AI - 极物聊天",
  description: "极物聊天 - 极物圈 开启你的极物之旅！",
  keywords: appKeywords,
});
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
    sendTime: new Date().getTime(),
    content: "你好！欢迎光临极物圈，有什么可以帮您的吗？",
    type: MessageType.AI_CHAT,
    body: {
    },
  },
};
const setting = useSettingStore();
const user = useUserStore();
const form = ref({
  role: "user",
  content: "",
});
const inputRef = ref();
const status = ref<WsStatusEnum>(WsStatusEnum.CLOSE);

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

const msgList = useLocalStorage<ChatMessageVO[]>(`ai_chat_history_${user.userInfo.id}`, []);
// 是否在返回数据
const isChat = computed(() => status.value === WsStatusEnum.OPEN);
const formRef = ref();
function onSubmit() {
  if (status.value === WsStatusEnum.OPEN || !form.value.content || form.value.content.length < 1 || isChat.value)
    return;

  formRef.value?.validate((action: boolean) => {
    if (!action)
      return;
    sendMsg(form.value.content, user.userInfo.id);
    form.value.content = "";
    nextTick(() => {
      scrollBottom();
    });
  });
}

function onStop() {
  if (status.value === WsStatusEnum.OPEN)
    return;
  body.value.ws?.close();
  scrollBottom();
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
          sendTime: new Date().getTime(),
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
      id: Math.random() * 1000,
      roomId: 0,
      sendTime: new Date().getTime(),
      content: msg,
      type: MessageType.TEXT,
      body: {
      },
    },
  });
}

const scollRef = ref();
// 滚动到底部
function scrollBottom(animate = true) {
  if (scollRef.value?.wrapRef?.scrollTo && animate) {
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

const [autoAnimateRef, enable] = useAutoAnimate({});
onMounted(() => active());
onActivated(() => active());
function active() {
  if (!setting.isMobileSize)
    inputRef.value?.focus();

  if (msgList.value.length === 0)
    msgList.value.push(INIT_MSG);

  nextTick(() => {
    scrollBottom(false);
  });
  // 切换页面时关闭动画
  enable(!setting.settingPage.isCloseAllTransition);
}
</script>

<template>
  <div class="w-full flex flex-col p-4">
    <!-- header -->
    <p class="mb-4 text-[var(--el-color-primary)] font-600 tracking-0.2em">
      <i class="i-solar:ghost-bold mr-2 p-0.8em" />
      极物AI
    </p>
    <!-- 内容 -->
    <el-scrollbar ref="scollRef" view-class="h-full p-2 md:p-4" class="bg-light card-default dark:bg-dark-9">
      <div ref="autoAnimateRef" relative flex flex-col>
        <!-- 消息适配器 -->
        <ChatMsgMain
          v-for="(msg, i) in msgList" :id="`chat-msg-${msg.message.id}`" :key="msg.message.id" :index="i"
          :data="msg"
          :prev-msg="i > 0 ? msgList[i - 1] : undefined"
        />
      </div>
    </el-scrollbar>
    <el-form
      ref="formRef" v-auth :model="form"
      class="mt-4 flex items-center gap-2 sm:gap-4 bg-color"
      @submit.prevent="onSubmit"
    >
      <div>
        <el-tooltip content="新对话" placement="top">
          <CardElImage
            :src="user.userInfo.avatar ? BaseUrlImg + user.userInfo.avatar : ''"
            class="h-2.2rem w-2.2rem cursor-pointer rounded-1/2 shadow"
            @click="handleNewChat"
          />
        </el-tooltip>
      </div>
      <el-form-item
        prop="content" class="w-full" :rules="[{
          required: true,
          message: '',
          trigger: 'change',
        }]"
      >
        <el-input
          ref="inputRef"
          v-model.lazy="form.content"
          :disabled="isChat" placeholder="快开始对话吧 ✨"
          class="content mt-4 border-0 border-b-1px border-default"
        />
      </el-form-item>
      <BtnElButton
        class="group ml-a"
        :class="isChat ? 'animate-pulse' : ''"
        :icon-class="` block mr-1 ${isChat ? 'i-solar:menu-dots-bold-duotone ' : 'i-solar:map-arrow-right-bold-duotone'}`" round
        :type="isChat ? 'danger' : 'info'"
        @click="isChat ? onStop() : onSubmit()"
      >
        {{ isChat ? "结束" : "发送" }}&nbsp;
      </BtnElButton>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
.content {
  :deep(.el-input__wrapper) {
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: 2rem;
    padding: 0 1em;
    box-shadow: none !important;

    &.is-focus,
    &:hover,
    &.is-error {
      box-shadow: transparent !important;
      border-bottom: 1px solid #88888811;
    }
  }
}
</style>
