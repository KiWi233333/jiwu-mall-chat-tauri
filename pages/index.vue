<script lang="ts" setup>
import { appKeywords } from "@/constants/index";

definePageMeta({
  key: route => route.fullPath,
  layout: false,
  keepalive: true,
});
useSeoMeta({
  title: "极物聊天",
  description: "极物聊天 - 极物圈 开启你的极物之旅！",
  keywords: appKeywords,
});

const chat = useChatStore();
</script>

<template>
  <div>
    <NuxtLayout name="chat">
      <!-- 会话列表 -->
      <ChatContactList />
      <!-- 主内容 -->
      <template v-if="chat.theContact.roomId">
        <!-- 聊天框 -->
        <ChatContent class="flex-1 truncate border-0 border-l-1px border-default" />
        <!-- 在线人数 -->
        <ChatRoomGroup />
      </template>
      <div v-else data-fades class="h-full w-full flex flex-col items-center justify-center rounded-0 text-gray-600 shadow-md shadow-inset card-default dark:(text-gray-500)">
        <i i-solar:chat-line-bold-duotone class="mb-2 h-12 w-12" />
        <small>快开始聊天吧 ✨</small>
      </div>
    </NuxtLayout>
  </div>
</template>

