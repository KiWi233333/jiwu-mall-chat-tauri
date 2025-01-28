<script lang="ts" setup>
/**
 * 撤回消息
 */
const { data } = defineProps<{
  data: ChatMessageVO<RecallBodyDTO>;
  prevMsg?: Partial<ChatMessageVO<TextBodyMsgVO>>
}>();
const roomId = data.message?.roomId;
const chat = useChatStore();
const enoughEditMsgInfo = computed(() => chat.recallMsgMap[roomId] && chat.recallMsgMap[roomId].message.id === data.message.id ? chat.recallMsgMap[roomId] : undefined);

// 重新编辑消息
function editRecallMsg() {
  if (!enoughEditMsgInfo.value) {
    return;
  }
  if (enoughEditMsgInfo.value.message.type !== MessageType.TEXT || !enoughEditMsgInfo.value.message.content) {
    ElMessage.warning("非文字部分暂不支持重新编辑！");
  }
  // 重新编辑消息
  chat.msgForm = {
    roomId: enoughEditMsgInfo.value.message.roomId,
    msgType: MessageType.TEXT, // TODO: 暂时只支持文字消息
    content: enoughEditMsgInfo.value.message.content || "",
    body: {
      // ...enoughEditMsgInfo.message.body,
    },
  };
  nextTick(() => {
    mitter.emit(MittEventType.MSG_FORM, { type: "focus" });
  });
}
</script>

<template>
  <span class="recall mx-a my-2 max-w-full truncate px-4 text-wrap font-500 !w-fit text-mini-50">
    {{ data?.message?.content }}
    <span v-if="enoughEditMsgInfo" class="edit ml-1 el-color-info btn-info" title="只能重新编辑文字消息" @click="editRecallMsg()">重新编辑</span>
  </span>
</template>

<style lang="scss" scoped>
.avatar {
  order: 1;
}
.msg-popper {
  border-radius: 4px 2rem 2rem 2rem;
}
.self {
  justify-content: right;
  margin-left: auto;
  .flex-row {
   flex-direction: row-reverse;

  }
  flex-direction: row-reverse;

  .msg-popper {
    border-radius: 2rem 4px 2rem 2rem;
  }
}
</style>
