<script lang="ts" setup>
/**
 * RTC消息
 */
defineProps<{
  data: ChatMessageVO<RtcBodyMsgVO>
  prevMsg?: ChatMessageVO
  index: number
}>();
const chat = useChatStore();
</script>


<template>
  <ChatMsgTemplate
    :prev-msg="prevMsg"
    :index="index"
    :data="data"
    v-bind="$attrs"
  >
    <template #body>
      <div ctx-name="rtc" class="msg-popper min-w-6em cursor-pointer hover:op-80" @click="data.message.body?.type && chat.rollbackCall(data.message.roomId, data.message.body?.type, data)">
        <i ctx-name="rtc" class="icon p-2.6" :class="data.message.body?.type === CallTypeEnum.AUDIO ? 'i-solar:end-call-outline' : 'i-solar:videocamera-record-outline'" />
        {{ data.message.content }}
      </div>
    </template>
  </ChatMsgTemplate>
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
