import type { Message as BackMessage } from "@tauri-apps/plugin-websocket";
import type { WSAiStreamMsg, WSFriendApply, WSMemberChange, WsMsgBodyVO, WSMsgDelete, WSMsgRecall, WSOnlineOfflineNotify, WSPinContactMsg, WsSendMsgDTO } from "../../types/chat/WsType";
import type { ChatMessageVO } from "../api/chat/message";
import BackWebSocket from "@tauri-apps/plugin-websocket";
import { acceptHMRUpdate, defineStore } from "pinia";
import { notification } from "~/init/ws";
import { WsMsgBodyType, WsMsgType, WsStatusEnum } from "../../types/chat/WsType";


export interface WsMsgItemMap {
  newMsg: ChatMessageVO[];
  onlineNotice: WSOnlineOfflineNotify[];
  recallMsg: WSMsgRecall[];
  deleteMsg: WSMsgDelete[];
  applyMsg: WSFriendApply[];
  memberMsg: WSMemberChange[];
  tokenMsg: object[];
  rtcMsg: WSRtcCallMsg[];
  pinContactMsg: WSPinContactMsg[];
  aiStreamMsg: WSAiStreamMsg[];
  other: object[];
}

/**
 * 消息类型映射
 */
const wsMsgMap: Record<WsMsgBodyType, keyof WsMsgItemMap> = {
  [WsMsgBodyType.MESSAGE]: "newMsg",
  [WsMsgBodyType.ONLINE_OFFLINE_NOTIFY]: "onlineNotice",
  [WsMsgBodyType.RECALL]: "recallMsg",
  [WsMsgBodyType.DELETE]: "deleteMsg",
  [WsMsgBodyType.APPLY]: "applyMsg",
  [WsMsgBodyType.MEMBER_CHANGE]: "memberMsg",
  [WsMsgBodyType.TOKEN_EXPIRED_ERR]: "tokenMsg",
  [WsMsgBodyType.RTC_CALL]: "rtcMsg",
  [WsMsgBodyType.PIN_CONTACT]: "pinContactMsg",
  [WsMsgBodyType.AI_STREAM]: "aiStreamMsg",
};


// @unocss-include
// https://pinia.web3doc.top/ssr/nuxt.html#%E5%AE%89%E8%A3%85
export const useWsStore = defineStore(
  WS_STORE_KEY,
  () => {
    const webSocketHandler = ref<any>(null);
    const fullWsUrl = ref("");
    const isWindBlur = ref(false);
    const status = ref<WsStatusEnum>(WsStatusEnum.CLOSE);
    // 未消费信箱
    const wsMsgList = ref<WsMsgItemMap>({
      /**
       * 常规消息
       */
      newMsg: [] as ChatMessageVO[],
      /**
       * 上下线消息
       */
      onlineNotice: [] as WSOnlineOfflineNotify[],
      /**
       * 撤回消息
       */
      recallMsg: [] as WSMsgRecall[],
      /**
       * 删除消息
       */
      deleteMsg: [] as WSMsgDelete[],
      /**
       * 申请好友消息
       */
      applyMsg: [] as WSFriendApply[],
      /**
       * 群成员变动消息 WsMsgBodyType.MEMBER_CHANGE
       */
      memberMsg: [] as WSMemberChange[],
      /**
       * token失效
       */
      tokenMsg: [] as object[],
      /**
       * rtc通讯 WsMsgBodyType.RTC_CALL
       */
      rtcMsg: [] as WSRtcCallMsg[],
      /**
       * 置顶联系人消息 WsMsgBodyType.PIN_CONTACT
       */
      pinContactMsg: [] as WSPinContactMsg[],
      /**
       * ai推送流 11
       */
      aiStreamMsg: [] as WSAiStreamMsg[],
      other: [] as object[],
    });
    const { reload } = useWsInit();
    const isNewMsg = computed(() => wsMsgList.value.newMsg.length > 0);

    // 初始化 ws
    function useWsInit() {
      // 聊天模块
      const user = useUserStore();
      const setting = useSettingStore();

      // 通知消息类型  WsMsgBodyType
      const noticeType = {
        [WsMsgBodyType.MESSAGE]: true, // 普通消息
        [WsMsgBodyType.APPLY]: true, // 好友消息
      } as Record<WsMsgBodyType, boolean>;
      const chat = useChatStore();
      const isReload = ref(false);
      const worker = shallowRef<Worker>();

      // 初始化 Web Worker
      async function reload() {
        if (isReload.value) {
          return;
        }
        // 创建 Web Worker
        console.log("web worker reload");
        isReload.value = true;
        worker.value?.terminate?.(); // 关闭 WebSocket 连接
        await close?.(false); // 关闭 WebSocket 连接
        if (!user?.getTokenFn()) {
          isReload.value = false;
          return;
        }
        worker.value = new Worker("/useWsWorker.js");
        // 初始化 WebSocket 连接
        initDefault(() => {
          onMessage(async (msg) => {
            // 消息通知
            if (noticeType[msg.type]) {
              const body = msg.data as ChatMessageVO;
              if (body.fromUser?.userId && body.fromUser?.userId === user?.userId) { // 非当前用户消息通知
                return;
              }
              // 系统通知
              if (setting.settingPage.notificationType !== NotificationEnums.SYSTEM)
                return;
              if (!setting.isWeb || (setting.isWeb && !chat.isVisible)) // 非托盘通知且聊天显示
                notification(body);
            }
          });
          if (!worker.value) {
            return;
          }
          // 将 WebSocket 状态和noticeType发送给 Web Worker 初始化状态
          worker.value.postMessage({
            status: status.value,
            noticeType,
          });
        });
        // Web Worker 消息处理
        worker.value.onmessage = (e) => {
          if (e.data.type === "reload")
            reload();
          if (e.data.type === "heart") {
            if (status.value !== WsStatusEnum.OPEN || !webSocketHandler)
              return reload();
            sendHeart();
          }
          if (e.data.type === "log")
            console.log(e.data.data);
        };
        // Web Worker 错误处理
        worker.value.onerror = (e) => {
          console.error(e);
          reload();
        };
        // Web Worker 消息错误处理
        worker.value.onmessageerror = (e) => {
          console.error(e);
          reload();
        };
        isReload.value = false;
      }
      // 自动重连
      reload();
      watchDebounced([status, () => user.isLogin], ([status, isLogin]: [WsStatusEnum, boolean]) => {
        if (status !== WsStatusEnum.OPEN && isLogin) {
          reload();
        }
        else if (!isLogin) {
          worker.value?.terminate?.();
          close(false);
          worker.value = undefined;
        }
      }, {
        debounce: 3000,
        deep: true,
      });

      return {
        reload,
      };
    }

    // 默认初始化
    async function initDefault(call: () => any) {
      const setting = useSettingStore();
      const user = useUserStore();
      if (!user.getToken) {
        webSocketHandler.value?.close?.();
        webSocketHandler.value?.disconnect?.();
        status.value = WsStatusEnum.SAFE_CLOSE;
        return false;
      }
      // 1、websocket连接
      if (setting.isUseWebsocket) {
        // 1、连接
        if (webSocketHandler.value && status.value === WsStatusEnum.OPEN)
          return webSocketHandler.value;
        status.value = WsStatusEnum.CONNECTION;
        fullWsUrl.value = `${BaseWSUrl}?Authorization=${user.getToken}`;
        webSocketHandler.value = new WebSocket(fullWsUrl.value);
        status.value = WsStatusEnum.OPEN;
        // 2、打开
        if (!webSocketHandler.value) {
          status.value = WsStatusEnum.SAFE_CLOSE;
          return;
        }
        webSocketHandler.value.onopen = call;
        // 3、错误监听
        webSocketHandler?.value?.addEventListener("error", (e: Event) => {
          status.value = WsStatusEnum.CLOSE;
          webSocketHandler.value = null;
        });
        // 4、关闭监听
        webSocketHandler.value.addEventListener("close", (e: Event) => {
          status.value = WsStatusEnum.SAFE_CLOSE;
          webSocketHandler.value = null;
        });
        return true;
      }
      // rust websocket 连接
      if (webSocketHandler.value && status.value === WsStatusEnum.OPEN)
        return webSocketHandler.value;
      fullWsUrl.value = `${BaseWSUrl}?Authorization=${user.getToken}`;
      const ws = await BackWebSocket.connect(fullWsUrl.value);
      webSocketHandler.value = ws; // 保存连接
      // 1、打开
      status.value = ws.id ? WsStatusEnum.OPEN : WsStatusEnum.CLOSE;
      if (ws.id)
        call();
    }

    // 接收消息
    function onMessage(call: (data: WsMsgBodyVO) => void) {
      if (!webSocketHandler.value)
        return;
      const setting = useSettingStore();
      if (setting.isUseWebsocket) {
        webSocketHandler.value.onmessage = (event: MessageEvent) => {
          if (event && !event.data)
            return false;
          try {
            const data = JSON.parse(event.data) as Result<WsMsgBodyVO>;
            if (data) {
              const wsMsg = data.data;
              const body = wsMsg.data;
              if (wsMsgMap[wsMsg.type] !== undefined) { // 处理消息
                wsMsgList.value[wsMsgMap[wsMsg.type]].push(body as any);
                mitter.emit(resolteChatPath(wsMsg.type), body);
              }
              call(wsMsg);
            }
          }
          catch (err) {
            return null;
          }
        };
      }
      else { // rust ws
        webSocketHandler.value.addListener((msg: BackMessage) => {
          if ("WebSocket protocol error: Connection reset without closing handshake".includes(msg?.data?.toString() || "")) {
            status.value = WsStatusEnum.SAFE_CLOSE;
            webSocketHandler.value = null;
            return;
          }
          else if (msg?.data?.toString().includes("WebSocket protocol error")) {
            status.value = WsStatusEnum.CLOSE;
            webSocketHandler.value = null;
            return;
          }
          if (msg.type === "Close") {
            status.value = WsStatusEnum.SAFE_CLOSE;
            webSocketHandler.value = null;
          }
          else if (msg.type === "Text") {
            if (!msg.data)
              return false;

            // 这里需要处理一下，因为有时候会收到空数据
            try {
              const data = JSON.parse(String(msg.data)) as Result<WsMsgBodyVO>;
              if (data) {
                const cts = data.data;
                const body = cts.data;
                if (wsMsgMap[cts.type] !== undefined) { // 处理消息
                  wsMsgList.value[wsMsgMap[cts.type]].push(body as any);
                  mitter.emit(resolteChatPath(cts.type), body);
                }
                call(cts);
              }
            }
            catch (err) {
              return null;
            }
          }
          // 其他情况
          else if (!["Binary", "Ping", "Pong"].includes(msg.type)) {
            status.value = WsStatusEnum.SAFE_CLOSE;
            webSocketHandler.value = null;
          }
        });
      }
    }

    // 关闭
    async function close(isConfirm = true) {
      if (!isConfirm) {
        try {
          await webSocketHandler.value?.disconnect?.();
          await webSocketHandler.value?.close?.();
        }
        catch (err) {
        }
        finally {
          webSocketHandler.value = null; // 清空 WebSocket 连接
          status.value = WsStatusEnum.SAFE_CLOSE;
        }
        return;
      }
      ElMessageBox.confirm("是否断开会话？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        confirmButtonClass: "el-button--danger shadow border-default ",
        lockScroll: false,
        center: true,
        callback: async (res: string) => {
          if (res === "confirm") {
            if (!webSocketHandler.value)
              return;
            try {
              webSocketHandler.value?.close?.();
              webSocketHandler.value?.disconnect?.();
            }
            catch (err) {
            }
            status.value = WsStatusEnum.SAFE_CLOSE;
            ElNotification.success("断开成功！");
          }
        },
      });
    }

    // 心跳
    function sendHeart() {
      send({
        type: WsMsgType.HEARTBEAT,
        data: null,
      });
    }


    /**
     * 发送消息
     * @param dto 参数
     */
    function send(dto: WsSendMsgDTO) {
      if (webSocketHandler.value?.OPEN)
        webSocketHandler.value?.send(JSON.stringify(dto));
    }

    // 清除
    function resetStore() {
      try {
        close(false);
        webSocketHandler.value?.removeAllListeners?.();
        webSocketHandler.value?.close?.();
        webSocketHandler.value?.disconnect?.();
      }
      catch (err) {
      }
      finally {
        wsMsgList.value = {
          newMsg: [],
          onlineNotice: [],
          recallMsg: [],
          deleteMsg: [],
          applyMsg: [],
          memberMsg: [],
          rtcMsg: [],
          tokenMsg: [],
          pinContactMsg: [],
          aiStreamMsg: [],
          other: [],
        };
        status.value = WsStatusEnum.SAFE_CLOSE;
        fullWsUrl.value = "";
        isWindBlur.value = false;
        webSocketHandler.value = null;
      }
    }


    return {
      // state
      isNewMsg,
      webSocketHandler,
      status,
      isWindBlur,
      wsMsgList,
      // 方法
      resetStore,
      reload,
      initDefault,
      send,
      close,
      sendHeart,
      onMessage,
    };
  },
  {
    // https://prazdevs.github.io/pinia-plugin-persistedstate/frameworks/nuxt-3.html
    persist: false,
  },
);
if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useWsStore, import.meta.hot));

