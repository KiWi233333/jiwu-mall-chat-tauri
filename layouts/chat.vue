
<script lang="ts" setup>
import ContextMenu from "@imengyu/vue3-context-menu";
import { sendNotification } from "@tauri-apps/api/notification";
import { WsMsgBodyType, WsStatusEnum } from "~/composables/types/WsType";

// @unocss-include
// 右键菜单
const colorMode = useColorMode();
function onContextMenu(e: MouseEvent) {
  e.preventDefault();
  const opt = {
    x: e.x,
    y: e.y,
    theme: colorMode.preference === "dark" ? "mac dark" : "wind10",
    items: [
      {
        icon: colorMode.preference === "light" ? "i-solar:moon-stars-bold-duotone  text-[var(--el-color-primary)]" : "i-solar:sun-bold text-[var(--el-color-warning)]",
        shortcut: "Alt+K",
        label: colorMode.preference === "dark" ? "切换日间" : "切换夜间",
        onClick: () => {
          useModeToggle(colorMode.preference === "dark" ? "light" : "dark", e);
        },
      },
    ] as any,
  };

  ContextMenu.showContextMenu(opt);
}
const user = useUserStore();
const ws = useWs();
const showToast = ref(false);

// 通知消息类型  WsMsgBodyType
const noticeType = [
  WsMsgBodyType.MESSAGE, // 普通消息
];

// 创建 Web Worker
let worker: Worker;
// 初始化
function reload() {
  worker?.terminate?.();
  worker = new Worker("useWsWoker.js");
  // 初始化 WebSocket 连接
  ws.initDefault((e) => {
    // 将 WebSocket 状态和noticeType发送给 Web Worker 初始化状态
    worker.postMessage({
      status: ws.status,
      noticeType,
    });
    ws.onMessage((msg) => {
      // 消息通知
      // if (ws.isWindBlur && noticeType.includes(msg.type)) {
      if (noticeType.includes(msg.type)) {
        const body = msg.data as ChatMessageVO;
        sendNotification({
          icon: BaseUrlImg + body.fromUser.avatar,
          title: body.fromUser.nickName,
          body: `${body.message.content || "消息通知"}`,
        });
      }
    });
  });

  // Web Worker 消息处理
  worker.addEventListener("message", (e) => {
    console.log(e.data.type, e.data?.data);
    if (e.data.type === "reload")
      reload();
    if (e.data.type === "heart")
      ws.sendHeart();
    if (e.data.type === "log")
      console.log(e.data.data);
  });
}
// 退出登录时候
watch(
  () => user.isLogin,
  async (val) => {
    if (val)
      reload();
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <main class="h-100vh flex flex-col overflow-hidden border-default v-card">
    <div
      class="relative h-full flex flex-col overflow-hidden"
    >
      <MenuHeaderMenuBar>
        <template #drag-content>
          <div

            v-if="ws.status !== WsStatusEnum.OPEN || !user.isLogin" class="fixed top-2em rounded-4 text-center border-default card-default-br" animate-zoom-in-down p-2
          >
            <div mb-4 py-2>
              {{ ws.status !== WsStatusEnum.OPEN ? "会话断开" : !user.isLogin ? "未登录" : '网络错误' }}
            </div>
            <BtnElButton
              icon-class="i-solar:refresh-outline mr-1"
              class="hover:shadow-md"
              type="primary"
              round
              style="padding: 0 1em;height: 2em;line-height: 2em;"
              @click="reload()"
            >
              重连
            </BtnElButton>
            <BtnElButton
              icon-class="i-solar:power-bold mr-1"
              class="hover:shadow-md"
              type="danger"
              round
              style="padding: 0 1em;height: 2em;line-height: 2em;"
              @click="navigateTo('/login')"
            >
              登录
            </BtnElButton>
          </div>
        </template>
      </MenuHeaderMenuBar>
      <div
        class="main-box relative"
        v-bind="$attrs"
        @dblclick="onContextMenu($event)"
      >
        <MenuChatMenu />
        <slot />
      </div>
    </div>
    <!-- <div
      v-else-if="user.isLogin && ws.status !== WsStatusEnum.OPEN"
      v-bind="$attrs"
      class="main-box h-100vh flex-row-c-c overflow-hidden"
    >
      <OtherError :msg="ws.status === WsStatusEnum.CLOSE ? '服务连接失败，请重试' : '服务断开连接，请重连'" icon="i-solar:eye-line-duotone w-8rem h-8rem animate-[0.2s_fade-in_3]">
        <template #footer>
          <BtnElButton
            v-auth
            icon-class="i-solar:refresh-outline mr-2"
            class="hover:shadow-md"
            type="primary"
            @click="reload()"
          >
            重新连接
          </BtnElButton>
          <BtnElButton
            icon-class="i-solar:home-2-bold mr-2"
            class="hover:shadow-md"
            plain
            @click="navigateTo('/login')"
          >
            重新登录
          </BtnElButton>
        </template>
      </OtherError>
    </div> -->
  </main>
</template>

<style scoped lang="scss">
.main-box {
  --at-apply: "max-w-100vw mx-a py-4 flex-1 w-full flex overflow-hidden p-0 bg-color";
}
.main-box {
  padding: 0 !important;
}
.content {
  overflow-y: scroll;
  height: calc(100vh - $top-nav-height);
}
</style>
