<script lang="ts" setup>
/**
 * 消息适配器
 */
defineProps<{
  data: TheFriendOpt
}>();
</script>

<template>
  <div class="relative flex flex-col">
    <h4 class="flex-row-bt-c border-0 border-b-1 rounded-0 p-4 border-default bg-color md:p-4">
      新的朋友
    </h4>
    <el-scrollbar class="bg-white dark:bg-dark-7" view-class="p-2rem md:w-1/2 mx-a" wrap-class="w-full flex-1 h-full">
      <ChatFriendApplyList />
    </el-scrollbar>
  </div>
</template>

