<script lang="ts" setup>
import { dayjs } from "element-plus";
/**
 * RTC消息
 */
defineProps<{
  data: ChatMessageVO<RtcBodyMsgVO>
  index: number
}>();
const user = useUserStore();
const chat = useChatStore();
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
    <CardElImage :src="BaseUrlImg + data.fromUser.avatar" fit="cover" class="avatar h-2.4rem w-2.4rem flex-shrink-0 rounded-1/2 object-cover border-default" />
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
      </p>
      <!-- 内容 -->
      <slot name="body">
        <div class="msg-popper min-w-6em cursor-pointer hover:op-80" @click=" data.message.body?.type && chat.rollbackCall(data.message.roomId, data.message.body?.type, data)">
          <i class="icon p-2.6" :class="data.message.body?.type === CallTypeEnum.AUDIO ? 'i-solar:end-call-outline' : 'i-solar:videocamera-record-outline'" />
          {{ data.message.content }}
        </div>
      </slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './msg.scss';
.self {
  .msg-popper {
    .icon {
      float: right;
      margin-left: 0.5rem;
    }
  }
}
</style>
