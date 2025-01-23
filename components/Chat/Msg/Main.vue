<script lang="ts" setup>
import { ChatMsgAiMsg, ChatMsgDelete, ChatMsgFile, ChatMsgImg, ChatMsgOther, ChatMsgRecall, ChatMsgRTC, ChatMsgSound, ChatMsgSystem, ChatMsgText } from "#components";
import { MessageType } from "@/composables/api/chat/message";
import ContextMenu from "@imengyu/vue3-context-menu";
import { save } from "@tauri-apps/plugin-dialog";
import { appName } from "~/constants";

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
  const isSelf = user.userInfo.id === item.fromUser.userId;
  e.preventDefault();
  if (disabledRightClick.value)
    return;
  const msgType = data.message?.type;
  const isDownloaded = msgType === MessageType.FILE && setting.fileDownloadMap?.[BaseUrlFile + item.message.body.url];
  const opt = {
    x: e.x,
    y: e.y,
    theme: colorMode.preference === "dark" ? "mac dark" : "wind10",
    items: [
      {
        label: "保存图片",
        hidden: msgType !== MessageType.IMG,
        customClass: "group",
        icon: "i-solar-download-minimalistic-broken group-btn-info",
        onClick: async () => {
          let path: string | undefined | null = "";
          const fileName = path.split("\\").pop() || `${Date.now()}.png`;
          if (!setting.isWeb) {
            path = await save({
              title: setting.isDesktop ? `${appName} - 保存图片` : undefined,
              filters: [
                {
                  name: "图片文件",
                  extensions: ["png", "jpeg", "jpg", "svg", "webp"],
                },
              ],
              defaultPath: fileName,
            });
            if (!path)
              return;
          }
          // 下载图片
          downloadFile(BaseUrlFile + item.message.body.url, fileName, {
            targetPath: path,
          }, () => {
            ElMessage.success(setting.isWeb ? "图片已保存" : `图片已保存到 ${path}`);
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
        label: "联系TA",
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
  const oldData = JSON.parse(JSON.stringify(data));
  const res = await refundChatMessage(roomId, msgId, user.getToken);
  if (res.code === StatusCode.SUCCESS) {
    if (data.message.id === msgId) {
      if (data.message.content) {
        // 记录撤回的消息（提供后续撤回功能）
        chat.setRecallMsg(oldData);
      }
      data.message.type = MessageType.RECALL;
      data.message.content = `${data.fromUser.userId === user.userInfo.id ? "我" : `"${data.fromUser.nickName}"`}撤回了一条消息`;
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
          data.message.content = `${data.deleteUid === user.userInfo.id ? "我删除了一条消息" : `"${data.fromUser.nickName}"删除了一条成员消息`}`;
          data.message.body = undefined;
        }
      }
    },
  });
}

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
    @contextmenu="onContextMenu($event, data)"
  />
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
