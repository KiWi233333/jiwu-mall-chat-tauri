
<script lang="ts" setup>
const chat = useChatStore();
</script>

<template>
  <!-- 主内容 -->
  <template v-if="chat.theContact.roomId">
    <!-- 在线人数 -->
    <ChatRoomGroup />
  </template>
  <div v-else data-fades class="h-full w-full flex flex-col items-center justify-center rounded-0 text-gray-600 shadow-md shadow-inset card-default dark:(text-gray-500)">
    <i i-solar:chat-line-bold-duotone class="mb-2 h-12 w-12" />
    <small>快开始聊天吧 ✨</small>
  </div>
</template>

<style lang="scss" scoped>
.main-box {
  --at-apply: "mx-a py-4 flex-1 w-full flex overflow-hidden p-0 bg-color";
  padding: 0 !important;
}
</style>
