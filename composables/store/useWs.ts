import type { ChatMessageVO } from "../api/chat/message";
import type { WSFriendApply, WSMemberChange, WsMsgBodyVO, WSMsgDelete, WSMsgRecall, WSOnlineOfflineNotify, WsSendMsgDTO } from "../types/WsType";
import BackWebSocket, { type Message as BackMessage } from "@tauri-apps/plugin-websocket";
import { acceptHMRUpdate, defineStore } from "pinia";
import { WsMsgBodyType, WsMsgType, WsStatusEnum } from "../types/WsType";


// @unocss-include
// https://pinia.web3doc.top/ssr/nuxt.html#%E5%AE%89%E8%A3%85
export const useWs = defineStore(
  "chat_websocket",
  () => {
    const webSocketHandler = ref<any>(null);
    const fullWsUrl = ref("");
    const isWindBlur = ref(false);
    const status = ref<WsStatusEnum>(WsStatusEnum.CLOSE);
    // 未消费信箱
    const wsMsgList = ref({
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
       * 其他
       */
      other: [] as object[],
    });
    const reload = () => { };
    const isNewMsg = computed(() => wsMsgList.value.newMsg.length > 0);

    // 初始化
    async function initDefault(call: () => any) {
      const setting = useSettingStore();
      const user = useUserStore();
      if (!user.getToken) {
        webSocketHandler.value?.close?.();
        webSocketHandler.value?.disconnect?.();
        status.value = WsStatusEnum.SAFE_CLOSE;
        return false;
      }
      if (setting.isWeb) {
        // 1、连接
        link(BaseWSUrl, user.getToken);
        // 2、打开
        if (!webSocketHandler.value)
          return;
        webSocketHandler.value.onopen = call;
        // 3、错误监听
        webSocketHandler?.value?.addEventListener("error", (e: Event) => {
          status.value = WsStatusEnum.CLOSE;
          webSocketHandler.value = null;
          console.log(e);
        });
        // 4、关闭监听
        webSocketHandler.value.addEventListener("close", (e: Event) => {
          status.value = WsStatusEnum.SAFE_CLOSE;
          webSocketHandler.value = null;
        });
        return true;
      }

      // 移动、桌面端
      const url = BaseWSUrl;
      if (webSocketHandler.value && status.value === WsStatusEnum.OPEN)
        return webSocketHandler.value;
      fullWsUrl.value = `${url}?Authorization=${user.getToken}`;
      const ws = await BackWebSocket.connect(fullWsUrl.value);
      webSocketHandler.value = ws; // 保存连接
      // 1、打开
      status.value = ws.id ? WsStatusEnum.OPEN : WsStatusEnum.CLOSE;
      if (ws.id)
        call();
    }

    // 链接
    function link(url: string = BaseWSUrl, token: string = "") {
      if (webSocketHandler.value && status.value === WsStatusEnum.OPEN)
        return webSocketHandler.value;
      fullWsUrl.value = `${url}?Authorization=${token}`;
      webSocketHandler.value = new WebSocket(fullWsUrl.value);
      status.value = WsStatusEnum.OPEN;
      return webSocketHandler.value;
    }


    const wsMsgMap = {
      [WsMsgBodyType.MESSAGE]: "newMsg",
      [WsMsgBodyType.ONLINE_OFFLINE_NOTIFY]: "onlineNotice",
      [WsMsgBodyType.RECALL]: "recallMsg",
      [WsMsgBodyType.DELETE]: "deleteMsg",
      [WsMsgBodyType.APPLY]: "applyMsg",
      [WsMsgBodyType.MEMBER_CHANGE]: "memberMsg",
      [WsMsgBodyType.TOKEN_EXPIRED_ERR]: "tokenMsg",
    };

    // 接收消息
    function onMessage(call: (data: WsMsgBodyVO) => void) {
      if (!webSocketHandler.value)
        return;
      const setting = useSettingStore();
      if (setting.isWeb) {
        webSocketHandler.value.addEventListener("message", (event: MessageEvent) => {
          if (event && !event.data)
            return false;

          // 这里需要处理一下，因为有时候会收到空数据
          try {
            const data = JSON.parse(event.data);
            if (data) {
              const cts = data.data as WsMsgBodyVO;
              const body = cts.data;
              if (wsMsgMap[cts.type] !== undefined)
              // @ts-expect-error
                wsMsgList.value[wsMsgMap[cts.type]].push(body as any);
              call(cts);
            }
          }
          catch (err) {
            return null;
          }
        });
      }
      else { // 移动、桌面端
        webSocketHandler.value.addListener((msg: BackMessage) => {
          console.log(msg);
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
              const data = JSON.parse(String(msg.data));
              if (data) {
                const cts = data.data as WsMsgBodyVO;
                const body = cts.data;
                if (wsMsgMap[cts.type] !== undefined)
                  // @ts-expect-error
                  wsMsgList.value[wsMsgMap[cts.type]].push(body as any);
                call(cts);
              }
            }
            catch (err) {
              return null;
            }
          }
        });
      }
    }

    // 关闭
    function close(isConfirm = true) {
      if (!webSocketHandler.value)
        return;
      console.log("关闭会话");
      if (!isConfirm) {
        try {
          webSocketHandler.value?.close?.();
          webSocketHandler.value?.disconnect?.();
        }
        catch (err) {
        }
        status.value = WsStatusEnum.SAFE_CLOSE;
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
      close(false);
      wsMsgList.value = {
        newMsg: [],
        onlineNotice: [],
        recallMsg: [],
        deleteMsg: [],
        applyMsg: [],
        memberMsg: [],
        tokenMsg: [],
        other: [],
      };
      status.value = WsStatusEnum.SAFE_CLOSE;
      fullWsUrl.value = "";
      isWindBlur.value = false;
      webSocketHandler.value = null;
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
      onerror,
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
  import.meta.hot.accept(acceptHMRUpdate(useWs, import.meta.hot));

