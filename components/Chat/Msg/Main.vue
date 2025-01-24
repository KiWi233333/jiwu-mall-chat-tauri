<script lang="ts" setup>
import { ChatMsgAiMsg, ChatMsgDelete, ChatMsgFile, ChatMsgImg, ChatMsgOther, ChatMsgRecall, ChatMsgRTC, ChatMsgSound, ChatMsgSystem, ChatMsgText } from "#components";
import { MessageType } from "@/composables/api/chat/message";
import { onMsgContextMenu } from ".";

/**
 * 消息适配器
 */
const { data, prevMsg, index } = defineProps<{
  data: ChatMessageVO
  prevMsg?: ChatMessageVO
  index: number
}>();
const map: MsgComType = {
  [MessageType.TEXT]: ChatMsgText,
  [MessageType.RECALL]: ChatMsgRecall,
  [MessageType.DELETE]: ChatMsgDelete,
  [MessageType.IMG]: ChatMsgImg,
  [MessageType.FILE]: ChatMsgFile,
  [MessageType.SYSTEM]: ChatMsgSystem,
  [MessageType.AI_CHAT]: ChatMsgAiMsg,
  [MessageType.SOUND]: ChatMsgSound,
  [MessageType.RTC]: ChatMsgRTC,
};
interface MsgComType {
  [property: number]: any
}
const msgRef = ref<any>();
const chat = useChatStore();

// 右键菜单
const showTranslation = ref(false);
const route = useRoute();
const disabledRightClickList = [
  MessageType.AI_CHAT,
  MessageType.SYSTEM,
  MessageType.RECALL,
  MessageType.RECALL,
  MessageType.DELETE,
];
const disabledRightClick = computed(() => {
  const isAiChat = route.path.includes("ai");
  if (isAiChat)
    return true;

  if (data.message.type !== undefined && disabledRightClickList.includes(data.message.type))
    return true;

  return false;
});
// 是否显示时间
const showTime = prevMsg?.message?.sendTime && (data.message.sendTime - prevMsg?.message?.sendTime) > 300000; // 5分钟内显示时间

// 点击头像
function onClickAvatar() {
  if (!data.fromUser.userId)
    return;
  chat.setTheFriendOpt(FriendOptType.User, {
    id: data.fromUser.userId,
  });
  nextTick(() => {
    navigateTo("/friend");
  });
}
</script>

<template>
  <p v-if="showTime" w-full py-2 text-center text-0.8em op-60>
    {{ formatFriendlyDate(new Date(data.message.sendTime)) }}
  </p>
  <component
    :is="map[data.message?.type || MessageType.TEXT] || ChatMsgOther"
    ref="msgRef"
    :show-translation="showTranslation"
    :prev-msg="prevMsg"
    :index="index"
    :data="data"
    v-bind="$attrs"
    @click-avatar="onClickAvatar"
    @contextmenu="onMsgContextMenu($event, data)"
  />
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
