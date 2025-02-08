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
  <div class="flex items-center !py-9px">
    <p class="truncate">
      {{ (modelValue || '').slice(0, 50) }}
    </p>
    <span class="mx-2 flex-shrink-0 btn-info text-small" @click="emit('toggle', true)">展开
      <i i-solar:alt-arrow-down-line-duotone p-2 />
    </span>
  </div>
</template>

<style lang="scss" scoped>
@use '../Msg/msg.scss';
.markdown {
  :deep(.md-editor-preview-wrapper)  {
    padding: 0;
    img {
      border-radius: 0.25rem;
      overflow: hidden;
      max-width: 12rem !important;
      max-height: 12rem !important;
    }
    ol,
    ul {
      padding-left: 1.5em;
      margin-top: .5em;
    }
    .md-editor-code {
      .md-editor-code-block {
         line-height: 1.6em;
        & ~ span[rn-wrapper] >span {
         line-height: 1.6em;
        }
      }
      --at-apply: 'overflow-hidden leading-2em card-default border-default hover:shadow transition-all mb-2';
      code {
        border-radius: 0 0 8px 8px;
      }
    }

  }
}
</style>
