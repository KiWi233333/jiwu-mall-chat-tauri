<script lang="ts" setup>
/**
 * 折叠消息
 */
defineProps<{
  modelValue?: string
}>();
const emit = defineEmits<{
  (e: "toggle", value: boolean): void
}>();
</script>


<template>
  <div class="flex items-center">
    <p class="truncate">
      {{ (modelValue || '').slice(0, 50) }}
    </p>
    <span class="mx-2 flex-shrink-0 btn-info text-small" @click="emit('toggle', true)">展开
      <i i-solar:alt-arrow-down-line-duotone p-2 />
    </span>
  </div>
</template>

<style lang="scss" scoped>
</style>
