<script lang="ts" setup>
/**
 * 系统消息
 */
defineProps<{
  data: ChatMessageVO<GroupNoticeBodyMsgVO>
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
      <div class="msg-popper group notice text-left text-0.9rem" ctx-name="content">
        <div ctx-name="content" mb-2 pb-2 text-left border-default-b text-small dark:text-gray-300>
          <i ctx-name="content" class="i-carbon:bullhorn mr-1 p-2 text-[--el-color-warning] font-500 group-hover:animate-pulse" /> 群通知
        </div>
        <div ctx-name="content" class="msg-wrap max-w-20em min-w-14em leading-1.6em text-color">
          {{ data?.message?.content }}
        </div>
      </div>
      <small
        v-if="data?.message?.body?.noticeAll"
        ctx-name="atUidList"
        class="notice-all flex-ml-a"
      >
        @所有人
      </small>
    </template>
  </ChatMsgTemplate>
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
