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
      <div class="msg-popper group notice mb-2 text-left text-0.9rem" ctx-name="content">
        <div ctx-name="content" mb-2 pb-2 text-left border-default-b text-small dark:text-gray-300>
          <i ctx-name="content" class="i-carbon:bullhorn mr-1 p-2 group-hover:animate-pulse dark:text-[--el-color-warning]" /> 群通知
        </div>
        <div ctx-name="content" class="max-w-20em min-w-14em leading-1.6em text-color">
          {{ data?.message?.content }}
        </div>
      </div>
    </template>
  </ChatMsgTemplate>
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
