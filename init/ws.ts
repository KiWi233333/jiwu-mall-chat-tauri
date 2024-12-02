import { sendNotification } from "@tauri-apps/plugin-notification";
import { WsMsgBodyType, WsStatusEnum } from "~/composables/types/WsType";
import { sendWebNotification } from "~/composables/utils/useWebToast";


export async function useWsInit() {
  // 聊天模块
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
  const isReload = ref(false);

  // 初始化 Web Worker
  async function reload() {
    if (isReload.value) {
      return;
    }
    console.log("web worker reload");
    isReload.value = true;
    worker?.terminate?.(); // 关闭 WebSocket 连接
    await ws?.close?.(false); // 关闭 WebSocket 连接
    if (!user.isLogin) {
      return;
    }
    worker = new Worker("useWsWorker.js");
    // 初始化 WebSocket 连接
    ws.initDefault(() => {
      // 将 WebSocket 状态和noticeType发送给 Web Worker 初始化状态
      worker.postMessage({
        status: ws.status,
        noticeType,
      });
      ws.onMessage(async (msg) => {
        // 消息通知
        if (noticeType[msg.type]) {
          const body = msg.data as ChatMessageVO;
          if (body.fromUser.userId === user.userId) { // 非当前用户消息通知
            return;
          }
          // 聊天消息通知
          if (setting.settingPage.isTrayNotification === undefined) // 关闭通知
            return;

          if (setting.settingPage.isTrayNotification === false || (setting.isWeb && !chat.isVisible)) // 非托盘通知且聊天显示
            notification(body);
        }
      });
    });
    // Web Worker 消息处理
    worker.onmessage = (e) => {
      if (e.data.type === "reload")
        reload();
      if (e.data.type === "heart") {
        if (ws.status !== WsStatusEnum.OPEN || !ws.webSocketHandler)
          return reload();
        ws.sendHeart();
      }
      if (e.data.type === "log")
        console.log(e.data.data);
    };
    // Web Worker 错误处理
    worker.onerror = (e) => {
      console.error(e);
      reload();
    };
    // Web Worker 消息错误处理
    worker.onmessageerror = (e) => {
      console.error(e);
      reload();
    };
    setTimeout(() => {
      isReload.value = false;
    }, 500);
  }
  // 自动重连
  watchDebounced([() => ws.status, () => user.isLogin], (val: [WsStatusEnum, boolean]) => {
    if (val[0] !== WsStatusEnum.OPEN && val[1]) {
      reload();
    }
    else if (!val[1]) {
      ws.close(false);
    }
  }, {
    debounce: 500,
    immediate: true,
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
