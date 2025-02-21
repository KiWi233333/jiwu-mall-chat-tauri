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
    <div class="h-4.2rem flex items-center rounded-0 px-6 md:p-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="mx-2 h-6 w-6 text-color" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 2c0 .444-.193.843-.5 1.118V5h5a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h5V3.118A1.5 1.5 0 1 1 13.5 2M0 10h2v6H0zm24 0h-2v6h2zM9 14.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3m7.5-1.5a1.5 1.5 0 1 0-3 0a1.5 1.5 0 0 0 3 0" /></svg>
      <strong text-0.9em font-500>
        AI 机器人
      </strong>
    </div>
    <el-scrollbar
      wrap-class="w-full flex-1 h-full px-6 sm:px-8 flex justify-center"
      view-class="w-full flex-1 h-full"
      class="w-full flex-1"
    >
      <div data-fades>
        <h3 mb-4 mt-2 text-center text-1.2em sm:mb-8 sm:text-1.4em>
          AI点亮日常，智趣触手可及
        </h3>
        <ChatFriendRobotList />
      </div>
    </el-scrollbar>
  </div>
</template>

<style lang="scss" scoped>
</style>

