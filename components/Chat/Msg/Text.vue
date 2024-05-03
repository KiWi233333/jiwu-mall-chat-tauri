<script lang="ts" setup>
/**
 * 文本消息
 */
const props = defineProps<{
  data: ChatMessageVO<TextBodyMsgVO>
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
const body: Partial<TextBodyMsgVO> | undefined = props.data.message?.body || {};

// @人
const getAtText = computed(() => {
  if (body?.atUidList && body?.atUidList.length > 0)
    return chat.onOfflineList.filter(item => body?.atUidList?.includes(item.userId)).map(item => `@${item.nickName}`).join("、");
  else
    return "";
});
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
    <div class="body">
      <!-- 昵称 -->
      <small class="nickname">
        {{ data.fromUser.nickName }}
      </small>
      <!-- 内容 -->
      <p class="msg-popper">
        {{ data.message.content }}
      </p>
      <!-- AT @ -->
      <small v-if="body?.atUidList && body?.atUidList.length" class="flex-ml-a w-fit cursor-pointer truncate px-2 py-1 op-70 border-default card-default">
        {{ getAtText }}
      </small>
      <!-- 回复 -->
      <small v-if="body?.reply" class="truncate px-2 text-0.75em op-80 btn-primary border-default card-default" @click="chat.scrollReplyMsg(body?.reply?.id || 0, body?.reply?.gapCount)">
        回复: {{ `${body.reply.nickName}:${body.reply?.body || ''}` }}
      </small>
    </div>
  </div>
  <p v-if="index % 8 === 0" w-full py-2 text-center text-0.8em op-80>
    {{ getTime(data.message.sendTime) }}
  </p>
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
