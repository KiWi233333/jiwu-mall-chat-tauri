<script lang="ts" setup>
import { dayjs } from "element-plus";

/**
 * 文本消息
 */
const { data } = defineProps<{
  data: ChatMessageVO<TextBodyMsgVO | ImgBodyMsgVO>
  lastMsg: Partial<ChatMessageVO<TextBodyMsgVO>>
  index: number
}>();
defineEmits(["clickAvatar"]);

const chat = useChatStore();
const user = useUserStore();
// 具体
const body: Partial<TextBodyMsgVO> | undefined = computed(() => data.message?.body as Partial<TextBodyMsgVO> | undefined);

// @人
const getAtText = computed(() => {
  if (body?.atUidList && body?.atUidList.length > 0)
    return chat.onOfflineList.filter(item => body?.atUidList?.includes(item.userId)).map(item => `@${item.nickName}`).join("、");
  else
    return "";
});

function onCopyMsg(msg?: string | null) {
  if (!msg)
    return;
  const res = useCopyText(msg);
  if (res)
    ElMessage.success("复制成功");
}
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
    <!-- 头像 -->
    <CardElImage
      error-class="i-solar:user-broken"
      :src="BaseUrlImg + data.fromUser.avatar" fit="cover" class="avatar h-2.4rem w-2.4rem flex-shrink-0 cursor-pointer rounded-1/2 object-cover border-default"
      @click="$emit('clickAvatar', data.fromUser.userId)"
    />
    <!-- 消息体 -->
    <div class="body">
      <p class="flex-res truncate">
        <!-- 昵称 -->
        <small class="nickname">
          {{ data.fromUser.nickName }}
        </small>
        <small class="sendTime text-0.7em op-0">
          {{ dayjs(data.message.sendTime).format("YYYY-MM-DD HH:mm:ss") }}
        </small>
        <small class="sendTime text-0.7em op-0 btn-info" @click="onCopyMsg(data.message.content)">
          复制
        </small>
      </p>
      <!-- 内容 -->
      <slot name="body">
        <p class="msg-popper">
          {{ data.message.content }}
        </p>
      </slot>
      <!-- AT @ -->
      <small
        v-if="body?.atUidList && body?.atUidList.length && getAtText"
        :title="getAtText" class="at-list flex-ml-a w-fit cursor-pointer truncate px-2 op-70 border-default card-default"
      >
        {{ getAtText }}
      </small>
      <!-- 回复 -->
      <small v-if="body?.reply" title="点击跳转" class="max-w-50vw w-fit cursor-pointer truncate truncate px-2 text-0.75em op-80 sm:max-w-30em btn-primary border-default card-default" @click="chat.scrollReplyMsg(body?.reply?.id || 0, body?.reply?.gapCount)">
        回复：{{ `${body.reply.nickName}:${body.reply?.body || ''}` }}
      </small>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
