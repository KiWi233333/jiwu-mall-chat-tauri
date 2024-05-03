<script lang="ts" setup>
defineProps<{
  src: string
  loadClass?: string
  errorClass?: string
}>();
</script>

<template>
  <el-image
    :src="src"
    fit="cover"
    v-bind="$attrs"
  >
    <!-- 占位 -->
    <template #placeholder>
      <div :class="loadClass !== undefined ? loadClass : 'sky-loading h-full w-full flex-row-c-c'" />
    </template>
    <!-- 错误 -->
    <template #error>
      <div class="h-full w-full flex-row-c-c animate-fade-in">
        <i class="icon" i-solar:danger-triangle-linear :class="errorClass" opacity-50 />
      </div>
    </template>
  </el-image>
</template>

<style scoped lang="scss">
.icon {
  -at-apply: "block max-w-2/3 min-h-1rem min-w-1rem"
}
</style>
