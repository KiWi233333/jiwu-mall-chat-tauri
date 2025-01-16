<script lang="ts" setup>
import type { ChatMessageList } from "#components";

defineProps<{
  roomId?: string
}>();
const chat = useChatStore();
const ChatMessageListRef = ref<InstanceType<typeof ChatMessageList>>();
// 发送信息后触发
async function onSendMsg(msg: ChatMessageVO) {
  ChatMessageListRef.value?.appendMsg(msg);
  await nextTick();
  chat.scrollBottom?.(false);
};
</script>

<template>
  <div class="content relative flex flex-col bg-light-6 dark:bg-dark-9">
    <!-- 房间信息 -->
    <ChatRoomInfo />
    <!-- 消息列表 -->
    <ChatMessageList ref="ChatMessageListRef" />
    <!-- 发送 -->
    <ChatMsgForm class="flex-shrink-0" @submit="onSendMsg" />
  </div>
</template>

<style lang="scss" scoped>
.content {

  :deep(.el-scrollbar) {
    .el-scrollbar__bar {
      opacity: 0.6;
      .el-scrollbar__thumb:active,
      .el-scrollbar__thumb:hover {
        opacity: 1;
      }
    }
  }
}
</style>


