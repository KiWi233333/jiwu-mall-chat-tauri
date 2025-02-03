<script lang="ts" setup>
import { MdPreview } from "md-editor-v3";
import "md-editor-v3/lib/style.css";

/**
 * AI消息
 */
defineProps<{
  data: ChatMessageVO<AiChatReplyBodyMsgVO>;
  prevMsg: ChatMessageVO
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
      <MdPreview
        :id="`msg-md-${data.message.id}`"
        language="zh-CN"
        show-code-row-number
        :theme="$colorMode.value === 'dark' ? 'dark' : 'light'"
        code-theme="a11y"
        :code-foldable="false"
        style="font-size: 1em;color: inherit;padding: 0.3em 0.8em; color: inherit;"
        ctx-name="content"
        class="msg-popper markdown !max-w-18em sm:!max-w-34vw"
        :model-value="data.message?.content || ''"
      />
    </template>
  </ChatMsgTemplate>
</template>

<style lang="scss" scoped>
@use './msg.scss';
// @use "md-editor-v3/lib/preview.css";
.markdown {
  :deep(.md-editor-preview-wrapper)  {
    color: inherit;
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
      margin:  0.2em 0;
    }
    .md-editor-preview {
      color: var(--el-text-color-primary);
      line-height: 0;
    }
    .md-editor-code {
      margin: 0.6em 0 0 0;
      display: flex;
      flex-direction: column;
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
