<script lang="ts" setup>
defineProps<{
  roomId?: string
}>();
</script>

<template>
  <div class="content relative flex flex-col bg-color-df">
    <!-- 房间信息 -->
    <ChatRoomInfo />
    <!-- 消息列表 -->
    <ChatMessageList />
    <!-- 发送 -->
    <ChatMsgForm class="flex-shrink-0" />
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


