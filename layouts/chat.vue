
<script lang="ts" setup>
import ContextMenu from "@imengyu/vue3-context-menu";
import { WsStatusEnum } from "~/composables/types/WsType";

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
</script>

<template>
  <main class="h-100vh flex flex-col overflow-hidden border-default v-card">
    <div
      class="relative h-full flex flex-col overflow-hidden"
    >
      <MenuHeaderMenuBar>
        <template #drag-content>
          <div v-if="ws.status !== WsStatusEnum.OPEN || (!user.isLogin && !user.getToken)" data-tauri-drag-region class="fixed left-0 top-0 z-999 h-100vh w-100vw card-default-br" />
          <div
            v-if="ws.status !== WsStatusEnum.OPEN || (!user.isLogin && !user.getToken)" class="fixed top-4em z-1000 rounded-4 text-center border-default card-default-br" animate-zoom-in-down p-2 shadow-lg
          >
            <div mb-4 py-2>
              {{ ws.status !== WsStatusEnum.OPEN ? "会话断开" : (!user.isLogin && !user.getToken) ? "未登录" : '网络错误' }}
            </div>
            <BtnElButton
              icon-class="i-solar:refresh-outline mr-1"
              class="hover:shadow-md"
              type="primary"
              round
              style="padding: 0 1em;height: 2em;line-height: 2em;"
              @click="ws.reload()"
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
