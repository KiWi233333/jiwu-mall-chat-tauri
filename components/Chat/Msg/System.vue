<script lang="ts" setup>
/**
 * 系统消息
 */
defineProps<{
  data: ChatMessageVO<any>
  prevMsg: Partial<ChatMessageVO>
  index: number
}>();
</script>

<template>
  <ChatMsgTemplate
    :prev-msg="prevMsg"
    :index="index"
    :data="data"
    v-bind="$attrs"
  >
    <template #body>
      <div class="msg-popper system text-left text-0.9rem" ctx-name="content">
        <div ctx-name="content" mb-2 pb-2 text-left border-default-b text-small dark:text-light-8>
          <i ctx-name="content" class="i-solar:siren-rounded-bold-duotone mr-1 p-2 dark:text-[--el-color-warning]" /> 群通知
        </div>
        <div ctx-name="content" class="max-w-20em min-w-14em leading-1.6em">
          {{ data?.message?.content }}
        </div>
      </div>
    </template>
  </ChatMsgTemplate>
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
