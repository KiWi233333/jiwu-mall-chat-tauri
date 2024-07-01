<script lang="ts" setup>
/**
 * 文本消息
 */
defineProps<{
  data: ChatMessageVO<TextBodyMsgVO>
  lastMsg: Partial<ChatMessageVO<TextBodyMsgVO>>
  index: number
}>();
</script>

<template>
  <ChatMsgTemplate
    :last-msg="lastMsg"
    :index="index"
    :data="data"
    v-bind="$attrs"
  />
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
