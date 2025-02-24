<script lang="ts" setup>
defineProps<{
  roomId?: string
}>();
</script>

<template>
  <div class="content flex-1">
    <!-- 房间信息 -->
    <ChatRoomInfo class="relative z-10 shadow-sm card-bg-color" />
    <!-- 消息列表 -->
    <ChatMessageList />
    <!-- 发送 -->
    <ChatMsgForm class="card-bg-color-2" />
  </div>
</template>

<style lang="scss" scoped>
.content {
  --at-apply: "bg-color-3  relative w-full flex flex-col";

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


