<script lang="ts" setup>
/**
 * 图片消息
 */
const props = defineProps<{
  data: ChatMessageVO<ImgBodyMsgVO>
  index: number
}>();

const { data } = toRefs(props);
const user = useUserStore();
// 具体
const body: Partial<ImgBodyMsgVO> | undefined = props.data.message?.body || {};
</script>

<template>
  <div
    v-bind="$attrs"
    :label="data.roomId"
    class="msg"
    :class="{
      self: user?.userInfo?.id && data?.fromUser?.userId === user?.userInfo?.id,
    }"
  >
    <CardElImage :src="BaseUrlImg + data.fromUser.avatar" fit="cover" class="h-2.4rem w-2.4rem rounded-1/2 object-cover border-default" />
    <!-- 消息体 -->
    <div class="body">
      <!-- 头像 -->
      <small class="nickname">
        {{ data.fromUser.nickName }}
      </small>
      <!-- 内容 -->
      <CardElImage
        v-if="body?.url" :src="BaseUrlImg + body?.url"
        class="img h-9rem max-w-16rem shadow-sm border-default card-default bg-color"
        preview-teleported
        :alt="body?.url"
        :preview-src-list="[BaseUrlImg + body?.url]"
      />
      <p w-fit p-2 leading-1.2em class="self-child msg-popper transform-origin-ct shadow-sm transition-300 transition-transform active:scale-95 bg-color">
        {{ data.message.content }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
