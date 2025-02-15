<script lang="ts" setup>
// import { dayjs } from "element-plus";

/**
 * 消息模板（默认文本）
 * ctx-name 用于右键菜单
 */
const { data } = defineProps<{
  data: ChatMessageVO<TextBodyMsgVO | ImgBodyMsgVO | RtcBodyMsgVO | AiChatBodyMsgVO | GroupNoticeBodyMsgVO | AiChatReplyBodyMsgVO>;
  prevMsg?: Partial<ChatMessageVO<TextBodyMsgVO>>
  index: number
}>();
defineEmits(["clickAvatar"]);

const chat = useChatStore();
const user = useUserStore();
// 具体
const body = computed(() => data.message?.body as Partial<TextBodyMsgVO> | undefined);
const isSelf = user?.userInfo?.id && data?.fromUser?.userId === user?.userInfo?.id;
</script>

<template>
  <div
    v-bind="$attrs"
    class="msg"
    :class="{
      self: isSelf,
    }"
  >
    <!-- 头像 -->
    <CardElImage
      ctx-name="avatar"
      error-class="i-solar:user-bold-duotone"
      :src="BaseUrlImg + data.fromUser.avatar"
      fit="cover"
      class="avatar h-2.4rem w-2.4rem flex-shrink-0 cursor-pointer rounded-1/2 object-cover border-default"
      @click="$emit('clickAvatar', data.fromUser.userId)"
    />
    <!-- 消息体 -->
    <div class="body">
      <div class="flex-res">
        <!-- 昵称 -->
        <small class="nickname flex-1 truncate" ctx-name="nickname">
          {{ data.fromUser.nickName }}
        </small>
        <!-- 插槽 -->
        <slot name="name-after" />
        <!-- <small class="sendTime text-0.7em op-0" ctx-name="sendTime">
          {{ dayjs(data.message.sendTime).format("YYYY-MM-DD HH:mm:ss") }}
        </small> -->
      </div>
      <!-- 内容 -->
      <slot name="body">
        <p class="msg-popper msg-wrap" ctx-name="content">
          {{ data.message.content }}
        </p>
      </slot>
      <!-- 回复 -->
      <small
        v-if="body?.reply"
        title="点击跳转"
        ctx-name="reply"
        class="reply"
        @click="chat.scrollReplyMsg(body?.reply?.id || 0, body?.reply?.gapCount, false)"
      >
        <i class="i-solar:forward-2-bold-duotone mr-1 p-2" />
        {{ `${body.reply.nickName} : ${body.reply?.body?.substring(0, 50) || ''}` }}
      </small>
      <!-- AT @ -->
      <small
        v-if="body?.atUidList?.length && body?.atUidList.includes(user?.userInfo?.id)"
        ctx-name="atUidList"
        class="at-list flex-ml-a"
      >
        有人@我
      </small>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
