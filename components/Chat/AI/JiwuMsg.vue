<script lang="ts" setup>
import { MdPreview } from "md-editor-v3";
import "md-editor-v3/lib/preview.css";

/**
 * AI消息 - 极物圈ai的消息模板
 */
defineProps<{
  data: ChatMessageVO<TextBodyMsgVO>
  prevMsg?: ChatMessageVO
  index: number
}>();

const user = useUserStore();
</script>


<template>
  <ChatMsgTemplate
    :prev-msg="prevMsg"
    :index="index"
    :data="data"
    v-bind="$attrs"
  >
    <template #body>
      <!-- 内容 -->
      <template v-if="data.fromUser.userId === user.userInfo.id">
        <p class="msg-popper mt-2">
          {{ data.message?.content }}
        </p>
      </template>
      <MdPreview
        v-else
        language="zh-CN"
        show-code-row-number
        :theme="$colorMode.value === 'dark' ? 'dark' : 'light'"
        code-theme="a11y"
        :code-foldable="false"
        style="font-size: 1em;color: inherit;padding: 0.3em 0.8em;"
        class="msg-popper markdown mt-2 sm:max-w-40rem text-color"
        :model-value="data.message?.content || ''"
      />
    </template>
  </ChatMsgTemplate>
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
