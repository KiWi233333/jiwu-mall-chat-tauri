<script lang="ts" setup>
/**
 * 撤回消息
 */
defineProps<{
  data: Partial<ChatMessageVO>
}>();
</script>

<template>
  <span class="mx-a my-2 w-fit rounded-1em px-4 py-1 text-0.8rem font-500 op-60 border-default card-default">
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
