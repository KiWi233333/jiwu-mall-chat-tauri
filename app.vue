<script setup lang="ts">
import { useInit, useUmounted } from "./app/index";
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
onMounted(() => {
  useInit();
});

onUnmounted(() => {
  useUmounted();
});
</script>

<template>
  <div id="app">
    <NuxtPage />
  </div>
</template>

<style lang="scss">
// .page-enter-active,
</style>
