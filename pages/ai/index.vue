<script setup lang="ts">
import { WsStatusEnum } from "~/composables/types/WsType";

const user = useUserStore();
const form = ref({
  role: "user",
  content: "",
});
const status = ref<WsStatusEnum>(WsStatusEnum.CLOSE);

const body = ref({
  ws: null as WebSocket | null,
});

const dto = ref({
  header: {
    app_id: "3b3875ac",
    uid: user.userInfo.id,
  },
  parameter: {
    chat: {
      domain: "general",
      temperature: 0.8,
      top_k: 4,
      max_tokens: 2028,
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
interface AiChatMsgDTO {
  role: "user" | "admin" | "ai"
  content: string
}

// 是否在返回数据
const isChat = ref(false);


const formRef = ref();
function onSubmit() {
  if (status.value === WsStatusEnum.OPEN)
    return;

  formRef.value?.validate((action: boolean) => {
    if (!action)
      return;
    isChat.value = true;
    senMsg(form.value.content, user.userInfo.id);
    scrollBottom();
    form.value.content = "";
  });
}
const msgList = useLocalStorage<ChatMessageVO[]>(`ai_chat_history_${user.userInfo.id}`, []);
function senMsg(msg: string, id: string) {
  if (body.value.ws && body.value.ws.OPEN === 1)
    return;

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
      sendTime: new Date().toDateString(),
      content: msg,
      type: MessageType.TEXT,
      body: {
      },
    },
  });

  body.value.ws = new WebSocket("wss://spark-openapi.cn-huabei-1.xf-yun.com/v1/assistants/u8h3bh6wxkq8_v1");
  status.value = WsStatusEnum.OPEN;
  body.value.ws.onopen = (e) => {
    dto.value.payload.message.text[0].content = msg;
    dto.value.header.uid = id;
    body.value.ws?.send(JSON.stringify(dto.value));
    status.value = WsStatusEnum.OPEN;
  };
  body.value.ws.onclose = () => {
    status.value = WsStatusEnum.SAFE_CLOSE;
    body.value.ws = null;
    scrollBottom();
  };

  body.value.ws.onerror = () => {
    status.value = WsStatusEnum.CLOSE;
    body.value.ws = null;
    scrollBottom();
  };
  body.value.ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data) {
      status.value = data.header.code as WsStatusEnum;
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
          sendTime: new Date().toDateString(),
          content: text.value,
          type: MessageType.AI_CHAT,
          body: {
          },
        },
      });
      ;
    }
    status.value = WsStatusEnum.CLOSE;
    scrollBottom();
  };
}

watch(status, (newVal, oldVal) => {
  if (newVal === WsStatusEnum.OPEN) {
    isChat.value = newVal === WsStatusEnum.OPEN;
  }
  else {
    isChat.value = false;
    body.value.ws = null;
  }
});

const scollRef = ref();
// 滚动到底部
function scrollBottom() {
  if (scollRef.value?.wrapRef?.scrollTo) {
    scollRef.value?.wrapRef?.scrollTo({
      top: scollRef?.value?.wrapRef?.scrollHeight + 20 || 0,
      behavior: "smooth",
    });
  }
  else {
    scollRef.value?.setScrollTop(scollRef?.value?.wrapRef?.scrollHeight + 20 || 0);
  }
}
definePageMeta({
  key: route => route.fullPath,
  layout: false,
});
</script>

<template>
  <div>
    <NuxtLayout name="chat">
      <section class="w-full flex flex-col p-4">
        <!-- header -->
        <p class="mb-4 text-[var(--el-color-primary)] font-600 tracking-0.2em">
          <i class="i-solar:ghost-bold mr-2 p-0.8em" />
          极物AI
        </p>
        <!-- 内容 -->
        <el-scrollbar ref="scollRef" view-class="h-full p-2 md:p-4" class="bg-light card-default dark:bg-dark-9">
          <div v-auto-animate relative flex flex-col>
            <!-- 消息适配器 -->
            <ChatMsgMain
              v-for="(msg, i) in msgList" :id="`chat-msg-${msg.message.id}`" :key="msg.message.id" :index="i"
              :data="msg"
            />
          </div>
        </el-scrollbar>
        <el-form
          ref="formRef" v-auth :model="form" :disabled="!user?.isLogin || isChat"
          class="sticky bottom-0 left-0 mt-2 flex items-center gap-3 p-2 bg-color sm:p-4" @submit.prevent="onSubmit"
        >
          <NuxtLink to="/user/info">
            <CardElImage
              :src="user.userInfo.avatar ? BaseUrlImg + user.userInfo.avatar : ''"
              class="h-2.4rem w-2.4rem rounded-1/2 border-default"
            />
          </NuxtLink>
          <el-form-item
            prop="content" class="w-full" :rules="[{
              required: true,
              message: '内容不能为空！',
              trigger: 'change',
            }]"
          >
            <el-input
              v-model.lazy="form.content"
              :disabled="!user.isLogin || isChat" placeholder="快开始对话吧 ✨"
              class="content border-0 border-b-1px pt-4 border-default"
            />
          </el-form-item>
          <BtnElButton
            class="group ml-a" icon-class="i-solar:map-arrow-right-bold-duotone block mr-1" round
            :disabled="!user.isLogin || isChat"
            transition-icon
            type="info" @click=" onSubmit "
          >
            发送&nbsp;
          </BtnElButton>
        </el-form>
      </section>
    </NuxtLayout>
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
