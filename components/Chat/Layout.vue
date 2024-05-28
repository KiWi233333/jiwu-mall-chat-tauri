
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
</script>

<template>
  <main class="h-100vh flex flex-col overflow-hidden shadow-lg v-card">
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
