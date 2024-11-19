import { sendNotification } from "@tauri-apps/plugin-notification";
import { WsMsgBodyType, WsStatusEnum } from "~/composables/types/WsType";
import { sendWebNotification } from "~/composables/utils/useWebToast";


export async function useWsInit() {
// 1、聊天模块
  const ws = useWs();
  const user = useUserStore();
  const setting = useSettingStore();
  // 通知消息类型  WsMsgBodyType
  const noticeType = {
    [WsMsgBodyType.MESSAGE]: true, // 普通消息
    [WsMsgBodyType.APPLY]: true, // 好友消息
  } as Record<WsMsgBodyType, boolean>;
  const chat = useChatStore();
  // 创建 Web Worker
  let worker: Worker;
  // 初始化 Web Worker
  function reload() {
    // web端
    worker?.removeEventListener?.("message", (e) => { });
    worker?.terminate?.(); // 关闭 WebSocket 连接
    worker = new Worker("useWsWorker.js");
    // 初始化 WebSocket 连接
    ws.initDefault((e) => {
    // 将 WebSocket 状态和noticeType发送给 Web Worker 初始化状态
      worker.postMessage({
        status: ws.status,
        noticeType,
      });
      ws.sendHeart();
      ws.onMessage(async (msg) => {
        // 消息通知
        if (noticeType[msg.type]) {
          const body = msg.data as ChatMessageVO;
          if (body.fromUser.userId === user.userId) { // 非当前用户消息通知
            return;
          }
          if (!setting.settingPage.isTrayNotification || (setting.isWeb && !chat.isVisible)) // 非托盘通知且聊天显示
            notification(body);
        }
      });
    });
    // Web Worker 消息处理
    worker.addEventListener("message", (e) => {
      if (e.data.type === "reload")
        reload();
      if (e.data.type === "heart")
        ws.sendHeart();
      if (e.data.type === "log")
        console.log(e.data.data);
    });
  }
  // 自动重连
  if (ws.status !== WsStatusEnum.OPEN && user.isLogin)
    reload();
  watchDebounced([() => ws.status, () => user.isLogin], (val: [WsStatusEnum, boolean]) => {
    if (val[0] !== WsStatusEnum.OPEN && val[1])
      reload();
    else if (!val[1])
      ws.webSocketHandler?.close();
  }, {
    debounce: 1000,
    immediate: false,
  });

  ws.reload = reload; // 暴露给外部调用，用于刷新Web Worker状态。
  return {
    ws,
    reload,
  };
}


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
  const ws = useWs();
  ws?.close(false);
}
