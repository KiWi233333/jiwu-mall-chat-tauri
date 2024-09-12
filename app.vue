<script setup lang="ts">
import { useInit, useUmounted } from "@/init/index";
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

// 用于iframe嵌入快速登录
const route = useRoute();
const user = useUserStore();
const token = route.query.token;
if (token)
  user.onUserLogin(String(token), true, "/");

onMounted(() => {
  useInit();
});

onUnmounted(() => {
  useUmounted();
});
</script>

<template>
  <div id="app scale-100">
    <NuxtPage />
  </div>
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
