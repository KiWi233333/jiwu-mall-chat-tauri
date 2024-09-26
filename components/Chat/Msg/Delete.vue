<script lang="ts" setup>
/**
 * 删除消息
 */
defineProps<{
  data: Partial<ChatMessageVO>
}>();
</script>

<template>
  <span class="mx-a my-2 max-w-full truncate px-4 py-1 pt-1.4 text-wrap text-0.7rem font-500 op-60 !w-fit border-default !rounded-1em card-default">
    {{ data?.message?.content }}
  </span>
</template>

<style lang="scss" scoped>
.avatar {
  order: 1;
}
.msg-popper {
  border-radius: 4px 2rem 2rem 2rem;
}
.self {
  justify-content: right;
  margin-left: auto;
  .flex-row {
   flex-direction: row-reverse;

  }
  flex-direction: row-reverse;

  .msg-popper {
    border-radius: 2rem 4px 2rem 2rem;
  }
}
</style>
