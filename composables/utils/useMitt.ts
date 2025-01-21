import mitt from "mitt";

export enum MittEventType {
  // ws接收消息事件
  MESSAGE = "chat-new-msg",
  ONLINE_OFFLINE_NOTIFY = "chat-online-offline-notify",
  RECALL = "chat-recall-notify",
  APPLY = "chat-apply-notify",
  MEMBER_CHANGE = "chat-member-change-notify",
  TOKEN_EXPIRED_ERR = "chat-token-expired-err",
  DELETE = "chat-delete",
  RTC_CALL = "chat-rtc-call",
  OTHER = "chat-other",
  // 组件滚动事件
  MSG_LIST_SCROLL = "msg-list-scroll",

}

// 组件滚动事件载荷
export interface MSG_LIST_SCROLL_EVENT_PLAOYLOAD {
  type: "scrollBottom" | "scrollTop" | "scrollReplyMsg" | "saveScrollTop",
  payload: any
}

// eslint-disable-next-line ts/consistent-type-definitions
type EventPayloadMap = {
  // ws接收消息事件
  [MittEventType.MESSAGE]: ChatMessageVO;
  [MittEventType.ONLINE_OFFLINE_NOTIFY]: WSOnlineOfflineNotify;
  [MittEventType.RECALL]: WSMsgRecall;
  [MittEventType.APPLY]: WSFriendApply;
  [MittEventType.MEMBER_CHANGE]: WSMemberChange;
  [MittEventType.TOKEN_EXPIRED_ERR]: object;
  [MittEventType.DELETE]: WSMsgDelete;
  [MittEventType.RTC_CALL]: WSRtcCallMsg;
  [MittEventType.OTHER]: object;
  // 消息列表组件事件
  [MittEventType.MSG_LIST_SCROLL]: MSG_LIST_SCROLL_EVENT_PLAOYLOAD;
};

export type MittEvents = {
  [K in keyof EventPayloadMap]: EventPayloadMap[K];
};


/** ******************** 消息事件映射 */
const eventAndWsMap: Readonly<Record<WsMsgBodyType, MittEventType>> = {
  [WsMsgBodyType.MESSAGE]: MittEventType.MESSAGE,
  [WsMsgBodyType.ONLINE_OFFLINE_NOTIFY]: MittEventType.ONLINE_OFFLINE_NOTIFY,
  [WsMsgBodyType.RECALL]: MittEventType.RECALL,
  [WsMsgBodyType.APPLY]: MittEventType.APPLY,
  [WsMsgBodyType.MEMBER_CHANGE]: MittEventType.MEMBER_CHANGE,
  [WsMsgBodyType.TOKEN_EXPIRED_ERR]: MittEventType.TOKEN_EXPIRED_ERR,
  [WsMsgBodyType.DELETE]: MittEventType.DELETE,
  [WsMsgBodyType.RTC_CALL]: MittEventType.RTC_CALL,
} as const;

export function resolteChatPath(type: WsMsgBodyType): MittEventType {
  return eventAndWsMap[type] || MittEventType.OTHER;
}


/** mitt instance */
export const mitter = mitt<MittEvents>();
