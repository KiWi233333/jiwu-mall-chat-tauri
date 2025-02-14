<script lang="ts" setup>
/**
 * 撤回消息
 */
const { data } = defineProps<{
  data: ChatMessageVO<RecallBodyDTO>;
  prevMsg?: Partial<ChatMessageVO<TextBodyMsgVO>>
}>();
</script>

<template>
  <span class="recall block max-w-full max-w-full w-full truncate px-4 py-2 text-center text-wrap font-500 text-mini-50">
    {{ data?.message?.content }}
  </span>
</template>

<style lang="scss" scoped>
</style>
