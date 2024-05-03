
<script lang="ts" setup>
import ContextMenu from "@imengyu/vue3-context-menu";
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
const timer = ref();


// 通知消息类型  WsMsgBodyType
const noticeType = [
  WsMsgBodyType.MESSAGE, // 普通消息
];


// 初始化
function load() {
  ws.initDefault((e) => {
    timer.value = setInterval(() => {
      if (ws.status === WsStatusEnum.CLOSE) {
        clearInterval(timer.value);
        timer.value = null;
        load();
      }
      else {
        // 心跳
        ws.sendHeart();
      }
    }, 20000);
    ws.onMessage((msg) => {
      // 消息通知
      if (ws.isWindBlur && noticeType.includes(msg.type)) {
        const body = msg.data as ChatMessageVO;
        useWebToast(
          `${body.fromUser.nickName}:`, // 发送人
        `${body.message.content}`, // 发送消息
        {
          icon: BaseUrlImg + body.fromUser.avatar,
        });
      }
    });
  });
}
// 退出登录时候
watch(
  () => user.isLogin,
  async (val) => {
    if (val)
      load();
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <main class="h-100vh flex flex-col overflow-hidden border-default v-card">
    <div
      v-if="user.isLogin && ws.status === WsStatusEnum.OPEN"
      class="relative h-full flex flex-col"
    >
      <MenuHeaderMenuBar />
      <div
        class="main-box relative"
        v-bind="$attrs"
        @dblclick="onContextMenu($event)"
      >
        <MenuChatMenu />
        <slot />
      </div>
    </div>
    <div
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
            transition-icon
            @click="load()"
          >
            重新连接
          </BtnElButton>
          <BtnElButton
            icon-class="i-solar:home-2-bold mr-2"
            class="hover:shadow-md"
            plain
            transition-icon
            @click="navigateTo('/')"
          >
            回到首页
          </BtnElButton>
        </template>
      </OtherError>
    </div>
    <!-- <div v-else class="main-box h-100vh flex-row-c-c">
      <OtherError msg="未登录,请登录后查看!" icon="i-solar:eye-line-duotone w-8rem h-8rem animate-[0.2s_fade-in_3]">
        <template #footer>
          <BtnElButton
            plain
            @click="$router.back()"
          >
            返 回
          </BtnElButton>
          <BtnElButton
            icon-class="i-solar:user-rounded-outline mr-2"
            class="hover:shadow-md"
            type="primary"
            transition-icon
            @click="user.showLoginForm = true "
          >
            登 录
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
