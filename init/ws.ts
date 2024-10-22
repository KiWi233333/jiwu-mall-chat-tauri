import { sendNotification } from "@tauri-apps/plugin-notification";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { WsMsgBodyType, WsStatusEnum } from "~/composables/types/WsType";

const appWindow = getCurrentWebviewWindow();

export async function useWsInit() {
// 1、聊天模块
  const ws = useWs();
  const user = useUserStore();
  // 通知消息类型  WsMsgBodyType
  const noticeType = [
    WsMsgBodyType.MESSAGE, // 普通消息
    WsMsgBodyType.APPLY, // 好友消息
  ];
  const chat = useChatStore();
  // 创建 Web Worker
  let worker: Worker;
  // 初始化
  function reload() {
    worker?.terminate?.();
    worker = new Worker("useWsWoker.js");
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
        if (noticeType.includes(msg.type)) {
          const body = msg.data as ChatMessageVO;
          const isFocused = await appWindow.isFocused();
          if (isFocused) {
            if (chat.theContact.roomId === body.message.roomId)
              chat.setReadList(chat.theContact.roomId);
          }
          else {
            sendNotification({
              icon: BaseUrlImg + body.fromUser.avatar,
              title: body.fromUser.nickName,
              body: `${body.message.content || "消息通知"}`,
            });
          }
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
  watchDebounced([() => ws.status, () => user.isLogin], (val: [WsStatusEnum, boolean]) => {
    if (val[0] !== WsStatusEnum.OPEN && val[1])
      reload();
    else if (!val[1])
      ws.webSocketHandler?.close();
  }, { debounce: 500, immediate: true });

  ws.reload = reload; // 暴露给外部调用，用于刷新Web Worker状态。
  return {
    ws,
    reload,
  };
}


export function useWSUnmounted() {
// 1、聊天模块
  const ws = useWs();
  ws?.close(false);
}
