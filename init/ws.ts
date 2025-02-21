import { sendNotification } from "@tauri-apps/plugin-notification";
import { sendWebNotification } from "~/composables/utils/useWebToast";


/**
 * 发送系统通知
 */
export function notification(msg: ChatMessageVO) {
  const setting = useSettingStore();
  // web 通知
  if (setting.isWeb) {
    const chat = useChatStore();
    sendWebNotification(msg.fromUser.nickName, `${msg.message.content || "消息通知"}`, {
      icon: msg.fromUser.avatar ? BaseUrlImg + msg.fromUser.avatar : "/logo.png",
      onClick: () => {
        chat.setContact(chat.contactMap[msg.message.roomId]);
      },
    });
    return;
  }
  // tauri 通知
  sendNotification({
    icon: ["android", "ios"].includes(setting.appPlatform) ? "/logo.png" : BaseUrlImg + msg.fromUser.avatar,
    title: msg.fromUser.nickName,
    body: `${msg.message.content || "消息通知"}`,
    largeBody: `${msg.message.content || "消息通知"}`,
    number: 1,
  });
}


export function useWSUnmounted() {
  const ws = useWsStore();
  ws?.close(false);
}
