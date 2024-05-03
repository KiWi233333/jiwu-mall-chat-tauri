<script lang="ts" setup>
import ContextMenu from "@imengyu/vue3-context-menu";
import { RoomType } from "@/composables/api/chat/contact";
import { MessageType } from "@/composables/api/chat/message";
import { ChatMsgAiMsg, ChatMsgDelete, ChatMsgImg, ChatMsgRecall, ChatMsgSystem, ChatMsgText } from "#components";


/**
 * 消息适配器
 */
const props = defineProps<{
  data: ChatMessageVO
  index: number
}>();
const map: MsgComType = {
  [MessageType.TEXT]: ChatMsgText,
  [MessageType.RECALL]: ChatMsgRecall,
  [MessageType.DELETE]: ChatMsgDelete,
  [MessageType.IMG]: ChatMsgImg,
  [MessageType.SYSTEM]: ChatMsgSystem,
  [MessageType.AI_CHAT]: ChatMsgAiMsg,
};
interface MsgComType {
  [property: number]: any
}

const chat = useChatStore();
const user = useUserStore();

// 权限
const getTheRoleType = computed(() => {
  return chat.theContact?.member?.role;
});
const isTheGroupOwner = computed(() => {
  return chat.theContact?.member?.role === ChatRoomRoleEnum.OWNER;
});
// 是否有权限（踢出群聊、）
const isTheGroupPermission = computed(() => {
  return chat.theContact?.member?.role === ChatRoomRoleEnum.OWNER || chat.theContact?.member?.role === ChatRoomRoleEnum.ADMIN;
});


// 右键菜单
const colorMode = useColorMode();
function onContextMenu(e: MouseEvent, item: ChatMessageVO) {
  e.preventDefault();
  if (item.message.type === MessageType.AI_CHAT)
    return;

  const isSelf = user.userInfo.id === item.fromUser.userId;

  const opt = {
    x: e.x,
    y: e.y,
    theme: colorMode.preference === "dark" ? "mac dark" : "wind10",
    items: [
      {
        label: "撤回",
        hidden: !isSelf,
        customClass: "group",
        icon: "i-solar:backspace-broken group-btn-danger",
        onClick: (): any => {
          refundMsg(item.message.roomId, item.message.id);
        },
      },

      {
        label: "删除",
        customClass: "group",
        icon: "i-solar:trash-bin-minimalistic-outline group-btn-danger",
        hidden: !isTheGroupPermission.value,
        onClick: (): any => {
          deleteMsg(item.message.roomId, item.message.id);
        },
      },
      {
        label: "联系人",
        icon: "i-solar:user-broken group-btn-primary",
        customClass: "group",
        hidden: isSelf,
        onClick: () => {
          chat.setTheFriendOpt(FriendOptType.User, {
            id: item.fromUser.userId,
          });
          nextTick(() => {
            navigateTo("/chat/friend");
          });
        },
      },
      {
        label: "TA",
        icon: "i-solar:mention-circle-broken group-btn-primary",
        customClass: "group",
        hidden: isSelf,
        onClick: () => {
          chat.setAtUid(item.fromUser.userId);
        },
      },
      {
        label: "回复",
        icon: "i-solar:arrow-to-down-right-line-duotone -rotate-90 group-btn-info",
        hidden: isSelf,
        onClick: () => {
          chat.setReplyMsg(item);
        },
      },
    ] as any[],
  };

  ContextMenu.showContextMenu(opt);
}


// 撤回消息
function refundMsg(roomId: number, msgId: number) {
  ElMessageBox.confirm("是否确认撤回消息？", "撤回提示", {
    lockScroll: false,
    confirmButtonText: "确 认",
    confirmButtonClass: "el-button--primary is-plain border-default ",
    cancelButtonText: "取 消",
    center: true,
    callback: async (action: string) => {
      if (action !== "confirm")
        return;
      const res = await refundChatMessage(roomId, msgId, user.getToken);
      if (res.code === StatusCode.SUCCESS) {
        ElMessage.success("撤回成功！");
        if (props.data.message.id === msgId) {
          props.data.message.type = MessageType.RECALL;
          props.data.message.content = `${chat.theContact.type === RoomType.GROUP ? `"${props.data.fromUser.nickName}"` : "\"对方\""}撤回了一条消息`;
          props.data.message.body = undefined;
        }
      }
    },
  });
}


// 删除消息
function deleteMsg(roomId: number, msgId: number) {
  ElMessageBox.confirm("是否确认删除消息？", "删除提示", {
    lockScroll: false,
    confirmButtonText: "确 认",
    confirmButtonClass: "el-button--primary is-plain border-default ",
    cancelButtonText: "取 消",
    center: true,
    callback: async (action: string) => {
      if (action !== "confirm")
        return;
      const res = await deleteChatMessage(roomId, msgId, user.getToken);
      if (res.code === StatusCode.SUCCESS) {
        ElMessage.success("删除成功！");
        if (props.data.message.id === msgId) {
          props.data.message.type = MessageType.RECALL;
          props.data.message.content = "删除了一条消息";
          props.data.message.body = undefined;
        }
      }
    },
  });
}
</script>

<template>
  <component
    :is="map[data.message?.type || MessageType.TEXT]"
    :index="index"
    :data="data" v-bind="$attrs"
    @contextmenu="onContextMenu($event, data)"
  />
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
