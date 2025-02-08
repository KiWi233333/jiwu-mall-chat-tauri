<script lang="ts" setup>
import { ChatAIEllipsisBody } from "#components";
import { MdPreview } from "md-editor-v3";
import "md-editor-v3/lib/style.css";

/**
 * AI消息
 */
const {
  data,
} = defineProps<{
  data: ChatMessageVO<AiChatReplyBodyMsgVO>;
  prevMsg: ChatMessageVO
  index: number
}>();

const chat = useChatStore();
const initFold = data.message?.content?.length && data.message?.content?.length > 300 && chat.theContact.activeTime > data.message.sendTime;
const isFold = ref(initFold);
</script>

<template>
  <ChatMsgTemplate
    :prev-msg="prevMsg"
    :index="index"
    :data="data"
    class="group"
    v-bind="$attrs"
  >
    <template #name-after>
      <span v-if="initFold && !isFold" class="flex-res mx-2 ml-a flex-shrink-0 text-sm btn-info text-small group-hover:op-100 sm:op-0" @click="isFold = !isFold">
        收起
        <i i-solar:alt-arrow-up-line-duotone p-2 />
      </span>
    </template>
    <template #body>
      <component
        :is="isFold ? ChatAIEllipsisBody : MdPreview"
        :id="`msg-md-${data.message.id}`"
        language="zh-CN"
        show-code-row-number
        :theme="$colorMode.value === 'dark' ? 'dark' : 'light'"
        code-theme="a11y"
        :code-foldable="false"
        style="font-size: 1em;color: inherit;padding: 0.3em 0.8em; color: inherit;"
        ctx-name="content"
        class="markdown msg-popper !max-w-18em sm:!max-w-30em"
        :model-value="data.message?.content"
        @toggle="() => (isFold = !isFold)"
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
    p {
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
