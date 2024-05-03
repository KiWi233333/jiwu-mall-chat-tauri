import { acceptHMRUpdate, defineStore } from "pinia";
import { WsMsgBodyType, WsMsgType, WsStatusEnum } from "../types/WsType";
import type { WSFriendApply, WSMemberChange, WSMsgDelete, WSMsgRecall, WSOnlineOfflineNotify, WsMsgBodyVO, WsMsgVO, WsSendMsgDTO } from "../types/WsType";

import type { ChatMessageVO } from "../api/chat/message";


// @unocss-include
// https://pinia.web3doc.top/ssr/nuxt.html#%E5%AE%89%E8%A3%85
export const useWs = defineStore(
  "chat_websocket",
  () => {
    const webSocketHandler = ref<WebSocket | null>(null);
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
       * 群成员变动消息
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

    // 初始化
    function initDefault(call: (event: Event) => any) {
      const user = useUserStore();
      if (!user.getToken) {
        webSocketHandler.value?.close();
        status.value = WsStatusEnum.SAFE_CLOSE;
        return false;
      }
      // 1、连接
      link(BaseWSUrl, user.getToken);
      // 2、打开
      open(call);
      // 3、错误监听
      onerror();
      oncolse();
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

    // 打开
    function open(call: (event: Event) => void) {
      if (!webSocketHandler.value)
        return;
      webSocketHandler.value.onopen = call;
    }
    // 错误重试
    function onerror() {
      if (!webSocketHandler.value)
        return;
      webSocketHandler.value.addEventListener("error", (e) => {
        status.value = WsStatusEnum.CLOSE;
        webSocketHandler.value = null;
      });
    }
    function oncolse() {
      if (!webSocketHandler.value)
        return;
      webSocketHandler.value.addEventListener("close", (e) => {
        status.value = WsStatusEnum.SAFE_CLOSE;
        webSocketHandler.value = null;
      });
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
      webSocketHandler.value.addEventListener("message", (event) => {
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


    // 关闭
    function close() {
      if (!webSocketHandler.value)
        return;
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
            webSocketHandler.value.close();
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


    return {
      // state
      webSocketHandler,
      status,
      isWindBlur,
      wsMsgList,
      // 方法
      onerror,
      initDefault,
      link,
      open,
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


interface WsMsgTypeMap<T = object> {
  [key: string]: T[]
}
