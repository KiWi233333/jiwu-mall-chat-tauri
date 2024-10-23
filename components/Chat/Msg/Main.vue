<script lang="ts" setup>
import ContextMenu from "@imengyu/vue3-context-menu";
import { save } from "@tauri-apps/plugin-dialog";
import { MessageType } from "@/composables/api/chat/message";
import { ChatMsgAiMsg, ChatMsgDelete, ChatMsgFile, ChatMsgImg, ChatMsgOther, ChatMsgRecall, ChatMsgSound, ChatMsgSystem, ChatMsgText } from "#components";


/**
 * 消息适配器
 */
const { data, lastMsg, index } = defineProps<{
  data: ChatMessageVO
  lastMsg?: ChatMessageVO
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
};
interface MsgComType {
  [property: number]: any
}
const msgRef = ref<any>();
const chat = useChatStore();
const user = useUserStore();

// 权限
// const getTheRoleType = computed(() => {
//   return chat.theContact?.member?.role;
// });
// const isTheGroupOwner = computed(() => {
//   return chat.theContact?.member?.role === ChatRoomRoleEnum.OWNER;
// });
// 是否有权限（踢出群聊、）
const isTheGroupPermission = computed(() => {
  return chat.theContact?.member?.role === ChatRoomRoleEnum.OWNER || chat.theContact?.member?.role === ChatRoomRoleEnum.ADMIN;
});


// 右键菜单
const showTranslation = ref(false);
const colorMode = useColorMode();
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
const setting = useSettingStore();

// 右键菜单
function onContextMenu(e: MouseEvent, item: ChatMessageVO) {
  e.preventDefault();
  if (disabledRightClick.value)
    return;
  const isSelf = user.userInfo.id === item.fromUser.userId;
  const msgType = data.message?.type;
  const isDownloaded = msgType === MessageType.FILE && setting.fileDownloadMap?.[BaseUrlFile + item.message.body.url];
  const opt = {
    x: e.x,
    y: e.y,
    theme: colorMode.preference === "dark" ? "mac dark" : "wind10",
    items: [
      {
        label: "保存图片",
        hidden: setting.isWeb || msgType !== MessageType.IMG,
        customClass: "group",
        icon: "i-solar-download-minimalistic-broken group-btn-info",
        onClick: async () => {
          const path = await save({
            filters: [
              {
                name: "图片文件",
                extensions: ["png", "jpeg", "jpg", "svg", "webp"],
              },
            ],
          });
          if (!path)
            return;
          const fileName = path.split("\\").pop() || "default.png";
          // 下载图片
          downloadFile(BaseUrlFile + item.message.body.url, fileName, {
            targetPath: path,
          }, () => {
            ElMessage.success(`图片已保存到 ${path}`);
          });
        },
      },
      {
        label: isDownloaded ? "打开文件" : "下载文件",
        hidden: setting.isWeb || msgType !== MessageType.FILE,
        customClass: "group",
        icon: isDownloaded ? "i-solar-file-line-duotone group-btn-info" : "i-solar-download-minimalistic-broken group-btn-info",
        onClick: () => {
          // 下载或者打开文件
          msgRef.value?.onDownloadFileAndOpen?.();
        },
      },
      {
        label: "在文件夹打开",
        hidden: setting.isWeb || msgType !== MessageType.FILE || !isDownloaded,
        customClass: "group",
        icon: "i-solar-folder-with-files-line-duotone group-btn-info",
        onClick: () => {
          // 打开文件所在文件夹
          setting.openFileFolder(isDownloaded as FileItem);
        },
      },
      {
        label: showTranslation.value ? "折叠转文字" : "转文字",
        hidden: msgType !== MessageType.SOUND || !data.message.body?.translation,
        customClass: "group",
        icon: "i-solar-text-broken group-btn-info",
        onClick: () => {
          showTranslation.value = !showTranslation.value;
        },
      },
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
            navigateTo("/friend");
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
        // hidden: isSelf,
        onClick: () => {
          chat.setReplyMsg(item);
        },
      },
    ] as any[],
  };

  ContextMenu.showContextMenu(opt);
}

// 撤回消息
async function refundMsg(roomId: number, msgId: number) {
  const res = await refundChatMessage(roomId, msgId, user.getToken);
  if (res.code === StatusCode.SUCCESS) {
    if (data.message.id === msgId) {
      data.message.type = MessageType.RECALL;
      data.message.content = `${data.fromUser.nickName}撤回了一条消息`;
      data.message.body = undefined;
    }
  }
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
        if (data.message.id === msgId) {
          data.message.type = MessageType.RECALL;
          data.message.content = "删除了一条消息";
          data.message.body = undefined;
        }
      }
    },
  });
}


function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  // const seconds = date.getSeconds().toString().padStart(2, '0');
  const isSameDay = date.toDateString() === new Date().toDateString();
  if (isSameDay)
    return `${hours}:${minutes}`;
  else
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}
const showTime = lastMsg?.message?.sendTime && (data.message.sendTime - lastMsg?.message?.sendTime) > 300000; // 5分钟内显示时间
</script>

<template>
  <p v-if="showTime" w-full py-2 text-center text-0.8em op-60>
    {{ formatDate(new Date(data.message.sendTime)) }}
  </p>
  <component
    :is="map[data.message?.type || MessageType.TEXT] || ChatMsgOther"
    ref="msgRef"
    :show-translation="showTranslation"
    :last-msg="lastMsg"
    :index="index"
    :data="data"
    v-bind="$attrs"
    @contextmenu="onContextMenu($event, data)"
  />
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
