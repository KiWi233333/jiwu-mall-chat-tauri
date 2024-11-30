<script lang="ts" setup>
defineProps<{
  roomId?: string
}>();
const chat = useChatStore();
// 发送信息后触发
function onSendMsg(msg: ChatMessageVO) {
  // ChatMessageListRef.value?.appendMsg(msg);
  nextTick(() => {
    setTimeout(() => {
      chat.scrollBottom?.(false);
    }, 300);
  }); // 发送消息后自动滚动到底部
};
</script>

<template>
  <div class="content relative flex flex-col bg-light-6 dark:bg-dark-9">
    <!-- 房间信息 -->
    <ChatRoomInfo />
    <!-- 消息列表 -->
    <ChatMessageList />
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


