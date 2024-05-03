<script lang="ts" setup>
/**
 * 图片消息
 */
const props = defineProps<{
  data: ChatMessageVO<ImgBodyMsgVO>
  index: number
}>();

const { data } = toRefs(props);
const chat = useChatStore();
const user = useUserStore();
const nowDate = Date.now();

function getTime(time: string) {
  return (nowDate - +time) > 24 * 3600
    ? useDateFormat(time, "YYYY-MM-DD HH:mm:ss").value.toString()
    : useDateFormat(time, "HH:mm:ss").value.toString()
  ;
}

// 具体
const body: Partial<ImgBodyMsgVO> | undefined = props.data.message?.body || {};
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
    <CardElImage :src="BaseUrlImg + data.fromUser.avatar" fit="cover" class="h-2.4rem w-2.4rem rounded-1/2 object-cover border-default" />
    <!-- 消息体 -->
    <div class="body">
      <!-- 头像 -->
      <small class="nickname">
        {{ data.fromUser.nickName }}
      </small>
      <!-- 内容 -->
      <CardElImage
        v-if="body.url" :src="BaseUrlImg + body.url"
        class="img h-8rem w-8rem shadow-sm border-default card-default bg-color"
        preview-teleported
        :alt="body.url"
        :preview-src-list="[BaseUrlImg + body.url]"
      />
      <p w-fit p-2 leading-1.2em class="self-child msg-popper transform-origin-ct shadow-sm transition-300 transition-transform active:scale-95 bg-color">
        {{ data.message.content }}
      </p>
    </div>
  </div>
  <p v-if="index % 8 === 0" w-full py-2 text-center text-0.8em op-80>
    {{ getTime(data.message.sendTime) }}
  </p>
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
