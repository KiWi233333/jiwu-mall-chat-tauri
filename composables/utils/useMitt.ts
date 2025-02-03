import mitt from "mitt";

export enum MittEventType {
  // Ws推送消息事件
  MESSAGE = "chat-new-msg", // 新消息
  ONLINE_OFFLINE_NOTIFY = "chat-online-offline-notify", // 上下线通知
  RECALL = "chat-recall-notify", // 撤回通知
  APPLY = "chat-apply-notify", // 好友申请通知
  MEMBER_CHANGE = "chat-member-change-notify", // 成员变更通知
  TOKEN_EXPIRED_ERR = "chat-token-expired-err", // token过期错误
  DELETE = "chat-delete", // 删除通知
  RTC_CALL = "chat-rtc-call", // 视频通话通知
  PIN_CONTACT = "chat-pin-contact", // 置顶通知
  AI_STREAM = "chat-ai-msg", // AI消息
  OTHER = "chat-other",

  // 组件滚动事件
  MSG_LIST_SCROLL = "chat-msg-list-scroll",
  // 表单操作事件
  MSG_FORM = "chat-msg-form",
  CHAT_AT_USER = "chat-at-user", // @用户事件
  CAHT_ASK_AI_ROBOT = "chat-ask-ai-robot", // 提问AI机器人事件
  // 视频组件事件
  VIDEO_READY = "video-ready",
}

// 组件滚动事件载荷
export interface MsgListScrollPayload {
  type: "scrollBottom" | "scrollTop" | "scrollReplyMsg" | "saveScrollTop",
  payload: any
}

// 视频组件事件载荷
export interface VideoReadyPayload {
  type: "play" | "play-dbsound" | "pause" | "ended",
  payload: {
    url: string;
    duration: number;
    thumbUrl?: string;
    mouseX: number;
    mouseY: number;

    size?: number;
    thumbSize?: number;
    thumbWidth?: number;
    thumbHeight?: number;
  }
}
// 表单操作事件载荷
export interface MsgFormEventPlaoyload {
  type: "focus" | "blur",
  payload?: any
}

// @用户事件载荷
export interface AtUserPlaoyload {
  type: "add" | "remove" | "clear",
  payload?: string | null
}
// 提问AI机器人事件载荷
export interface AskAiRobotPayload {
  type: "add" | "remove" | "clear",
  payload?: string // userId
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
  [MittEventType.PIN_CONTACT]: WSPinContactMsg;
  [MittEventType.AI_STREAM]: WSAiStreamMsg;
  [MittEventType.OTHER]: object;
  // 消息列表组件事件
  [MittEventType.MSG_LIST_SCROLL]: MsgListScrollPayload;
  // 表单操作事件
  [MittEventType.MSG_FORM]: MsgFormEventPlaoyload;
  [MittEventType.CHAT_AT_USER]: AtUserPlaoyload;
  [MittEventType.CAHT_ASK_AI_ROBOT]: AskAiRobotPayload;
  // 视频组件事件
  [MittEventType.VIDEO_READY]: VideoReadyPayload;
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
  [WsMsgBodyType.PIN_CONTACT]: MittEventType.PIN_CONTACT,
  [WsMsgBodyType.AI_STREAM]: MittEventType.AI_STREAM,
} as const;
export function resolteChatPath(type: WsMsgBodyType): MittEventType {
  return eventAndWsMap[type] || MittEventType.OTHER;
}


/** mitt instance */
export const mitter = mitt<MittEvents>();


export function removeAllEventListener() {
  mitter.off(MittEventType.MESSAGE);
  mitter.off(MittEventType.ONLINE_OFFLINE_NOTIFY);
  mitter.off(MittEventType.RECALL);
  mitter.off(MittEventType.APPLY);
  mitter.off(MittEventType.MEMBER_CHANGE);
  mitter.off(MittEventType.TOKEN_EXPIRED_ERR);
  mitter.off(MittEventType.DELETE);
  mitter.off(MittEventType.RTC_CALL);
  mitter.off(MittEventType.PIN_CONTACT);
  mitter.off(MittEventType.OTHER);
  mitter.off(MittEventType.MSG_LIST_SCROLL);
  mitter.off(MittEventType.MSG_FORM);
  mitter.off(MittEventType.VIDEO_READY);
  mitter.off(MittEventType.CHAT_AT_USER);
  mitter.off(MittEventType.CAHT_ASK_AI_ROBOT);
}
