<script setup lang="ts">
import { useDefaultInit, useInit, useUmounted } from "@/init/index";
import { appKeywords, appName } from "@/constants/index";

// https://nuxt.com.cn/docs/guide/directory-structure/app
useHead({
  title: `${appName}✨`,
  meta: [
    {
      name: "description",
      content: "极物圈-主页 开启你的极物之旅！",
    },
  ],
  htmlAttrs: {
    lang: "zh",
  },
});
useSeoMeta({
  title: `${appName}✨`,
  description: "极物圈-主页 开启你的极物之旅！",
  keywords: appKeywords,
});

// 初始化
const route = useRoute();
onMounted(() => {
  if (route.path === "/msg") // 进入消息页面
    useDefaultInit();
  else
    useInit();
});
onUnmounted(useUmounted);
</script>

<template>
  <NuxtPage keepalive class="h-100dvh border-default card-default bg-color" />
</template>

<style lang="scss">
// .page-enter-active,
// .page-leave-active {
//   opacity: 1;
//   transition-duration: 0.3s;
//   transition-property: filter, opacity;
//   will-change: filter, opacity;
// }

// .page-enter-from,
// .page-leave-to {
//   opacity: 0;
//   filter: blur(4px) contrast(4);
// }

// .dark .page-enter-from,
// .dark .page-leave-to {
//   opacity: 0.7;
//   filter: blur(4px) contrast(4);
// }
</style>
