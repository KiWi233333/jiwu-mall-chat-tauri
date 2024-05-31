<script lang="ts" setup>
import { MdPreview } from "md-editor-v3";
import "md-editor-v3/lib/preview.css";

/**
 * 文本消息
 */
const props = defineProps<{
  data: ChatMessageVO<TextBodyMsgVO>
  index: number
}>();

const { data } = toRefs(props);
const user = useUserStore();
const nowDate = Date.now();

function getTime(time: string) {
  return (nowDate - +time) > 24 * 3600
    ? useDateFormat(time, "YYYY-MM-DD HH:mm:ss").value.toString()
    : useDateFormat(time, "HH:mm:ss").value.toString()
  ;
}
const colorMode = useColorMode();
</script>


<template>
  <div
    v-bind="$attrs"
    :label="data.roomId"
    class="msg"
    :class="{
      self: data?.fromUser?.userId === user?.userInfo.id,
    }"
  >
    <!-- 头像 -->
    <CardElImage :src="BaseUrlImg + data.fromUser.avatar" fit="cover" class="avatar h-2.4rem w-2.4rem flex-shrink-0 rounded-1/2 object-cover border-default" />
    <!-- 消息体 -->
    <div class="flex flex-col">
      <!-- 昵称 -->
      <small class="nickname">
        {{ data.fromUser.nickName }}
      </small>
      <!-- 内容 -->
      <template v-if="data.fromUser.userId === user.userInfo.id">
        <p class="msg-popper mt-2">
          {{ data.message?.content }}
        </p>
      </template>
      <MdPreview
        v-else
        language="zh-CN"
        :editor-id="data.id"
        show-code-row-number
        :theme="colorMode.value === 'dark' ? 'dark' : 'light'"
        preview-theme="smart-blue"
        code-theme="a11y"
        :code-foldable="false"
        class="msg-popper markdown mt-2 text-1em sm:max-w-40rem"
        :model-value="data.message.content || ''"
      />
    </div>
  </div>
  <p v-if="index % 8 === 0" w-full py-2 text-center text-0.8em op-80>
    {{ getTime(data.message.sendTime) }}
  </p>
</template>

<style lang="scss" scoped>
@use './msg.scss';
.markdown {
  :deep(.md-editor-preview-wrapper)  {
    padding: 0;
    .md-editor-code {
      --at-apply: 'overflow-hidden card-default border-default hover:shadow transition-all mb-2';
      code {
        border-radius: 0 0 8px 8px;
      }
    }
  }
}
</style>
