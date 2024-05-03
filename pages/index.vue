<script lang="ts" setup>
import { appKeywords } from "@/constants/index";

definePageMeta({
  key: route => route.fullPath,
  layout: false,
  keepalive: true,
});

useSeoMeta({
  title: "极物聊天",
  description: "极物 - 聊天 - 极物圈 开启你的极物之旅！",
  keywords: appKeywords,
});
</script>

<template>
  <div>
    <NuxtLayout name="chat">
      <!-- 会话列表 -->
      <ChatContactTabs />
      <!-- 聊天框 -->
      <ChatContent class="flex-1 truncate border-0 border-l-1px border-default" />
      <!-- 在线人数 -->
      <ChatRoomGroup class="p-2 bg-color sm:p-4" />
    </NuxtLayout>
  </div>
</template>

