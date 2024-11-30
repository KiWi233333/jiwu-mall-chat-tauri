<script setup lang="ts">
import { appKeywords, appName } from "@/constants/index";
import { useDefaultInit, useInit, useUmounted } from "@/init/index";

// https://nuxt.com.cn/docs/guide/directory-structure/app
useHead({
  title: `${appName}✨`,
  meta: [
    {
      name: "description",
      content: "极物聊天 - 开启你的畅聊之旅！",
    },
  ],
  htmlAttrs: {
    lang: "zh",
  },
});
useSeoMeta({
  title: `${appName}✨`,
  description: "极物聊天 - 开启你的畅聊之旅！",
  keywords: appKeywords,
});

// 初始化
const route = useRoute();
const setting = useSettingStore();
const isIframe = ref(false);
const user = useUserStore();
onMounted(() => {
  if (window)
    isIframe.value = window?.self !== undefined && window?.self !== window?.top;
  if (route.path === "/msg") // 进入消息页面
    useDefaultInit();
  else
    useInit();
});
onUnmounted(useUmounted);
</script>

<template>
  <main
    class="h-100dvh flex-row-c-c"
  >
    <div
      class="h-full w-full overflow-hidden rounded-1.5 border-default bg-color"
      :class="{ 'sm:(w-1150px mx-a h-860px) md:(w-1360px mx-a h-860px)': !isIframe && setting.isWeb }"
    >
      <NuxtPage class="h-full w-full" />
    </div>
  </main>
</template>

<style lang="scss">
// .layout-enter-active,
// .layout-leave-active,
// .page-enter-active,
// .page-leave-active {
//   transition-duration: 0.2s;
//   will-change: opacity transform;
//   transform: none;
// }
// .layout-enter-from,
// .layout-leave-to,
// .page-enter-from,
// .page-leave-to {
//   opacity: 0;
//   transform: scale(0.9);
// }
// .dark .layout-enter-from,
// .dark .layout-leave-to,
// .dark .page-enter-from,
// .dark .page-leave-to {
//   opacity: 0;
//   transform: scale(0.9) translateY(10px);
// }
</style>
