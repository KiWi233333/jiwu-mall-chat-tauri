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
  <main class="h-100dvh flex-row-c-c">
    <NuxtPage
      :key="user.userId"
      class="h-full w-full border-default card-default bg-color"
      :class="{ 'sm:(w-1150px mx-a h-860px) md:(w-1360px mx-a h-860px)': !isIframe && setting.isWeb }"
    />
  </main>
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
