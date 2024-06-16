<script lang="ts" setup>
/**
 * 文本消息
 */
const props = defineProps<{
  data: ChatMessageVO<TextBodyMsgVO>
  lastMsg: Partial<ChatMessageVO<TextBodyMsgVO>>
  index: number
}>();

const { data } = toRefs(props);
const chat = useChatStore();
const user = useUserStore();
const nowDate = Date.now();

// const getTimeText = (nowDate - +data.value.message.sendTime) > 24 * 3600
//   ? useDateFormat(data.value.message.sendTime, "YYYY年MM月DD日 HH:mm:ss").value.toString()
//   : `今天${useDateFormat(data.value.message.sendTime, "HH:mm:ss").value.toString()}`;
const getTimeText = (nowDate - +data.value.message.sendTime) > 3600 * 24
  ? useDateFormat(data.value.message.sendTime, "YYYY年MM月DD日 HH:mm:ss").value.toString()
  : useDateFormat(data.value.message.sendTime, "HH:mm:ss").value.toString();


// 具体
const body: Partial<TextBodyMsgVO> | undefined = props.data.message?.body || {};

// @人
const getAtText = computed(() => {
  if (body?.atUidList && body?.atUidList.length > 0)
    return chat.onOfflineList.filter(item => body?.atUidList?.includes(item.userId)).map(item => `@${item.nickName}`).join("、");
  else
    return "";
});

const showTime = props.lastMsg?.message?.sendTime && (data.value.message.sendTime - props.lastMsg?.message?.sendTime) > 300000; // 5分钟内显示时间
</script>

<template>
  <p v-if="showTime" w-full py-2 text-center text-0.8em op-80>
    {{ getTimeText }}
  </p>
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
      <small v-if="body?.reply" class="max-w-50vw truncate px-2 text-0.75em op-80 btn-primary sm:max-w-30em border-default card-default" @click="chat.scrollReplyMsg(body?.reply?.id || 0, body?.reply?.gapCount)">
        回复：{{ `${body.reply.nickName}:${body.reply?.body || ''}` }}
      </small>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
