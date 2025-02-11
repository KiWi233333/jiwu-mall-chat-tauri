<script lang="ts" setup>
import { ChatAIEllipsisBody } from "#components";
import { MdPreview } from "md-editor-v3";
import "md-editor-v3/lib/style.css";

/**
 * AI回复消息
 */
const {
  data,
} = defineProps<{
  data: ChatMessageVO<AiChatReplyBodyMsgVO>;
  prevMsg: ChatMessageVO
  index: number
}>();
const OVERFLOW_LENGTH = 250;
const chat = useChatStore();
const initFold = data.message?.content?.length && data.message?.content?.length > OVERFLOW_LENGTH && chat.theContact.activeTime > data.message.sendTime;
const isFold = ref(initFold);
const isResonFold = ref(initFold);
</script>

<template>
  <ChatMsgTemplate :prev-msg="prevMsg" :index="index" :data="data" class="group" v-bind="$attrs">
    <template #name-after>
      <!-- 折叠 -->
      <span
        v-if="!isFold"
        class="flex-res mx-2 ml-a flex-shrink-0 text-sm btn-info text-small group-hover:op-100 sm:op-0"
        @click="isFold = !isFold"
      >
        收起
        <i i-solar:alt-arrow-up-line-duotone p-2 />
      </span>
    </template>
    <template #body>
      <div class="msg-popper min-h-2.5em">
        <!-- 思考内容 -->
        <p
          v-if="data.message?.body?.reasoningContent && !isFold" class="reson-content"
          :class="isResonFold ? 'h-2.5em truncate is-reson-open' : 'h-auto'"
        >
          思考：{{ data.message?.body?.reasoningContent }}
          <span
            class="text absolute bottom-1.5 right-1.5 z-2 h-2em px-3 leading-2em shadow btn-info text-mini"
            @click="isResonFold = !isResonFold"
          >
            {{ isResonFold ? '展开' : '收起' }}
            <i
              :class="isResonFold ? 'i-solar:alt-arrow-down-line-duotone' : 'i-solar:alt-arrow-up-line-duotone'"
              ml-1 p-1.5
            />
          </span>
        </p>
        <!-- 回答内容 -->
        <component
          :is="isFold ? ChatAIEllipsisBody : MdPreview"
          :id="`msg-md-${data.message.id}`"
          language="zh-CN"
          show-code-row-number
          :theme="$colorMode.value === 'dark' ? 'dark' : 'light'"
          code-theme="a11y"
          :code-foldable="false"
          ctx-name="content"
          class="markdown-preivew"
          :model-value="data.message?.content"
          @toggle="(val: boolean) => (isFold = val)"
        />
      </div>
    </template>
  </ChatMsgTemplate>
</template>

<style lang="scss" scoped>
@use './msg.scss';

.markdown-preivew {
  --at-apply: "text-0.9rem p-0 bg-color";
  // line-height: initial !important;
  font-size: inherit;

  :deep(.md-editor-preview-wrapper) {
    color: inherit;
    padding: 0 !important;
    font-size: inherit;

    .md-editor-preview {
      color: var(--el-text-color-primary);
      font-size: inherit;

      img {
        border-radius: 0.25rem;
        overflow: hidden;
        max-width: 12rem !important;
        max-height: 12rem !important;
      }

      p {
        margin: 0.4em 0;
      }

      p:not(p:last-of-type) {
        margin: 0 0 0.4em 0;
      }

      p:first-of-type {
        margin: 0;
      }

      .md-editor-code {
        line-height: 1.6;
        --at-apply: 'm-0 mt-2 flex flex-col overflow-hidden card-default border-default hover:shadow transition-all';

        .md-editor-code-block {
          line-height: 1.6;

          &~span[rn-wrapper]>span {
            line-height: 1.6;
          }
        }

        code {
          border-radius: 0 0 8px 8px;
        }

      }
    }
  }
}

.reson-content {
  --at-apply: "my-1 relative leading-1.5em overflow-hidden card-rounded-df p-2 shadow-(sm inset) bg-color-2 text-small";

  &::after {
    content: "";
    --at-apply: "bg-dark absolute z-1 left-0 bottom-0 w-full h-1/5 hover:(op-0 -z-1) op-100 transition-opacity";
    background: linear-gradient(to top, var(--el-bg-color), transparent);
  }
}
.is-reson-open .text {
  --at-apply: "bg-color-br";
}
</style>
