<script lang="ts" setup>
const {
  animteClass = "", // sky-loading
} = defineProps<{
  isSelf?: boolean;
  animteClass?: string;
}>();
</script>

<template>
  <div
    class="flex flex-shrink-0 gap-4 truncate px-4 py-3 transition-200 transition-shadow sm:(w-full p-4 px-5) hover:bg-[#7c7c7c1a] text-color"
  >
    <!-- 头像 -->
    <div
      class="h-2.4rem w-2.4rem flex-shrink-0 rounded bg-light-900 object-cover dark:bg-dark-4"
      :class="animteClass"
    />
    <!-- 信息 -->
    <div
      class="info-skeleton"
    >
      <!-- 昵称 -->
      <div
        :class="animteClass"
        class="nickname-skeleton h-4 w-8em rounded bg-light-900 dark:bg-dark-4"
      />
      <!-- 最近消息 -->
      <div
        class="mt-4 h-3 w-10em rounded bg-light-900 dark:bg-dark-4"
        :class="animteClass"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
</style>
