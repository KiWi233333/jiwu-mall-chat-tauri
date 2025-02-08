<script lang="ts" setup>
defineProps<{
  roomId?: string
}>();
</script>

<template>
  <div class="content relative max-wfull flex flex-col bg-color-3">
    <!-- 房间信息 -->
    <ChatRoomInfo class="border-default-b card-bg-color" />
    <!-- 消息列表 -->
    <ChatMessageList />
    <!-- 发送 -->
    <ChatMsgForm class="card-bg-color-2" />
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


