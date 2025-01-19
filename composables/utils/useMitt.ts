import mitt from "mitt";

export enum MittEventType {
  MESSAGE = "chat-new-msg",
  ONLINE_OFFLINE_NOTIFY = "chat-online-offline-notify",
  RECALL = "chat-recall-notify",
  APPLY = "chat-apply-notify",
  MEMBER_CHANGE = "chat-member-change-notify",
  TOKEN_EXPIRED_ERR = "chat-token-expired-err",
  DELETE = "chat-delete",
  RTC_CALL = "chat-rtc-call",
  OTHER = "chat-other",
}

// eslint-disable-next-line ts/consistent-type-definitions
type EventPayloadMap = {
  [MittEventType.MESSAGE]: ChatMessageVO;
  [MittEventType.ONLINE_OFFLINE_NOTIFY]: WSOnlineOfflineNotify;
  [MittEventType.RECALL]: WSMsgRecall;
  [MittEventType.APPLY]: WSFriendApply;
  [MittEventType.MEMBER_CHANGE]: WSMemberChange;
  [MittEventType.TOKEN_EXPIRED_ERR]: object;
  [MittEventType.DELETE]: WSMsgDelete;
  [MittEventType.RTC_CALL]: WSRtcCallMsg;
  [MittEventType.OTHER]: object;
};

export type MittEvents = {
  [K in keyof EventPayloadMap]: EventPayloadMap[K];
};

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


/** mitt instance */
export const mitter = mitt<MittEvents>();

export function resolteChatPath(type: WsMsgBodyType): MittEventType {
  return eventAndWsMap[type] || MittEventType.OTHER;
}
