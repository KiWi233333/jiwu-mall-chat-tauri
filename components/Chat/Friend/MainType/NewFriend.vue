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
    <h4 class="h-4.2rem flex items-center rounded-0 px-6 shadow border-default-b card-bg-color md:p-4">
      <i i-solar:user-plus-bold ml-2 mr-2 p-3 text-color />
      新的朋友
    </h4>
    <el-scrollbar class="card-bg-color-2" view-class="p-2rem md:w-2/3 mx-a" wrap-class="w-full flex-1 h-full">
      <ChatFriendApplyList />
    </el-scrollbar>
  </div>
</template>

