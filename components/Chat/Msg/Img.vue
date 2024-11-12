<script lang="ts" setup>
/**
 * 图片消息
 */
const props = defineProps<{
  data: ChatMessageVO<ImgBodyMsgVO>
  lastMsg: Partial<ChatMessageVO<TextBodyMsgVO>>
  index: number
}>();
const { data } = toRefs(props);
// 具体
const body: Partial<ImgBodyMsgVO> | undefined = props.data.message?.body || {};
</script>

<template>
  <ChatMsgTemplate
    :last-msg="lastMsg"
    :index="index"
    :data="data"
    v-bind="$attrs"
  >
    <template #body>
      <!-- 内容 -->
      <CardElImage
        v-if="body?.url"
        :src="BaseUrlImg + body?.url"
        class="h-9rem max-w-16rem min-w-6rem w-fit shadow-sm border-default card-default bg-color"
        preview-teleported
        :alt="body?.url"
        :preview-src-list="[BaseUrlImg + body?.url]"
      />
      <!-- 内容 -->
      <p v-if="data.message?.content?.trim()" class="msg-popper">
        {{ data.message.content }}
      </p>
    </template>
  </ChatMsgTemplate>
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
