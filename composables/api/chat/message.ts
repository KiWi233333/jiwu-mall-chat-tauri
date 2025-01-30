
/**
 * 获取消息列表（游标）
 * @param roomId 房间号
 * @param pageSize 大小
 * @param cursor 游标
 * @param token token
 * @returns 分页
 */
export function getChatMessagePage(roomId: number, pageSize = 10, cursor: string | number | null = null, token: string) {
  return useHttp.get<Result<CursorPage<ChatMessageVO>>>(
    "/chat/message/page",
    {
      roomId,
      pageSize,
      cursor,
    },
    {
      headers: {
        Authorization: token,
      },
    },
  );
  // if (res.code === StatusCode.SUCCESS) {
  //   res.data.list.
  // }
  // return res;
}
export function getDBMsgPage(roomId: number, pageSize = 10, cursor: string | number | null = null): Promise<Result<CursorPage<ChatMessageVO>>> {
  const res = {
    data: {
      list: [],
      cursor: null,
      isLast: false,
    },
    code: StatusCode.SUCCESS,
    message: "",
  } as Result<CursorPage<ChatMessageVO>>;
  // const db = useDB().getItem("message", "roomId");
  return Promise.resolve(res);
}


/**
 * 发送消息
 * @param dto 参数
 * @param token tokn
 * @returns 发送的组合消息
 */
export function addChatMessage(dto: ChatMessageDTO, token: string) {
  return useHttp.post<Result<ChatMessageVO>>(
    "/chat/message",
    { ...dto },
    {
      headers: {
        Authorization: token,
      },
    },
  );
}


/**
 * 撤回消息
 * @param roomId 房间号
 * @param id 消息id
 * @param token 身份
 * @returns 影响行
 */
export function refundChatMessage(roomId: number, id: number, token: string) {
  return useHttp.put<Result<ChatMessageVO>>(
    `/chat/message/recall/${roomId}/${id}`,
    {},
    {
      headers: {
        Authorization: token,
      },
    },
  );
}

/**
 * 删除消息
 * @param roomId 房间号
 * @param id 消息id
 * @param token 身份
 * @returns 影响行
 */
export function deleteChatMessage(roomId: number, id: number, token: string) {
  return useHttp.deleted<Result<ChatMessageVO>>(
    `/chat/message/recall/${roomId}/${id}`,
    {},
    {
      headers: {
        Authorization: token,
      },
    },
  );
}


/**
 * 获取消息的已读未读列表（单条消息）

 * @param msgId 消息id
 * @param searchType 类型
 * @param pageSize 页码
 * @param cursor 游标
 * @param token 身份
 * @returns 数据
 */
export function getChatMessageReadPage(msgId: number, searchType: number, pageSize = 10, cursor: string | number | null = null, token: string) {
  return useHttp.get<Result<CursorPage<ChatMessageReadVO>>>(
    "/chat/message/read/page",
    {
      msgId,
      pageSize,
      searchType,
      cursor,
    },
    {
      headers: {
        Authorization: token,
      },
    },
  );
}

/**
 * 消息阅读上报
 * @param roomId 房间号
 * @param token 身份
 * @returns 影响
 */
export function setMsgReadByRoomId(roomId: number, token: string) {
  return useHttp.put<Result<number>>(
    `/chat/message/msg/read/${roomId}`,
    {
    },
    {
      headers: {
        Authorization: token,
      },
    },
  );
}


/**
 * 消息返回体
 * Date: 2023-03-23
 *
 * ChatMessageVO
 */
export interface ChatMessageVO<T extends object = any> {
  /**
   * 发送者信息
   */
  fromUser: ChatUserInfo;
  /**
   * 消息详情
   */
  message: Message<T>;
  [property: string]: any;
}

/**
 * 发送者信息
 *
 * UserInfo
 */
export interface ChatUserInfo {
  userId: string;
  avatar?: null | string;
  gender?: Gender;
  nickName: string;
  [property: string]: any;
}
/**
 * 消息详情
 *
 * Message
 */
export interface Message<T extends object = object> {
  id: number;
  roomId: number;
  sendTime: number;
  /**
   * 文本内容
   */
  content?: null | string;
  /**
   * 消息类型
   */
  type?: MessageType;
  /**
   * 消息内容不同的消息类型，内容体不同，见https://www.yuque.com/snab/mallcaht/rkb2uz5k1qqdmcmd
   */
  body?: T;
}

/**
 * 文本消息
 */
export interface TextBodyMsgVO<T = object> {
  content: string;
  urlContentMap: { [key: string]: UrlInfoDTO };
  atUidList: string[];
  reply: {
    id: number;
    uid: string;
    nickName: string;
    type: MessageType;
    canCallback: isTrue;
    gapCount: number;
    body?: T;
  };
}
export interface UrlInfoDTO {
  title?: string;
  description?: string;
  /**
   * 网站LOGO
   */
  image?: string;

}

/**
 * 语音消息
 */
export interface SoundBodyMsgVO<T = object> {
  url: string;
  second: number;
  translation?: string; // 转文本
  reply: {
    id: number;
    uid: string;
    nickName: string;
    type: MessageType;
    canCallback: isTrue;
    gapCount: number;
    body?: T;
  };
}
/**
 * 图片消息
 */
export interface ImgBodyMsgVO {
  url: string;
  size?: number;
  width?: number;
  height?: number;
  reply: {
    id: number;
    uid: string;
    nickName: string;
    type: MessageType;
    /**
     * 是否可消息跳转 0否 1是
     */
    canCallback: isTrue;
    /**
     * 跳转间隔的消息条数
     */
    gapCount: number;
    body?: any;
  };
}


/**
 * 视频消息
 */
export interface VideoBodyMsgVO {
  url: string;
  size?: number;
  duration: number;
  thumbUrl: string;
  thumbSize?: number;
  thumbWidth?: number;
  thumbHeight?: number;
  reply: {
    id: number;
    uid: string;
    nickName: string;
    type: MessageType;
    /**
     * 是否可消息跳转 0否 1是
     */
    canCallback: isTrue;
    /**
     * 跳转间隔的消息条数
     */
    gapCount: number;
    body?: any;
  };
}

/**
 * 文件消息
 */
export interface FileBodyMsgVO {
  url: string;
  size: number;
  fileName: string;
  mimeType?: string;
  fileType?: FileBodyMsgTypeEnum;
  reply: {
    id: number;
    uid: string;
    nickName: string;
    type: MessageType;
    /**
     * 是否可消息跳转 0否 1是
     */
    canCallback: isTrue;
    /**
     * 跳转间隔的消息条数
     */
    gapCount: number;
    body?: any;
  };
}


/**
 * RTC消息 （公共系统显示的）
 */
export interface RtcLiteBodyMsgVO {
  // 发送者ID
  senderId?: string;
  // 通话状态
  status: CallStatusEnum;
  // 通话状态文本
  statusText: string;
  // 通话类型
  type: CallTypeEnum;
  // 通话类型文本
  typeText: string;
  // 开始时间戳
  startTime?: number;
  // 结束时间戳
  endTime?: number;
  // 通话时长文本
  durationText?: string;
}

export enum FileBodyMsgTypeEnum {
  //  "TXT" | "EXCEL" | "XLSX" | "PDF" | "PPT" | "PPTX" | "DOC" | "DOCX"
  TXT = "TXT",
  EXCEL = "EXCEL",
  XLSX = "XLSX",
  PDF = "PDF",
  PPT = "PPT",
  PPTX = "PPTX",
  DOC = "DOC",
  DOCX = "DOCX",
}

export enum MessageType {
  TEXT = 1,
  RECALL = 2,
  IMG = 3,
  FILE = 4,
  SOUND = 5,
  VIDEO = 6,
  EMOJI = 7, // 暂无
  SYSTEM = 8,
  AI_CHAT = 9, // 暂无
  DELETE = 10,
  RTC = 11, // rtc通话
}

export const MessageTypeText = {
  [MessageType.TEXT]: "正常消息",
  [MessageType.RECALL]: "撤回消息",
  [MessageType.IMG]: "图片",
  [MessageType.FILE]: "文件",
  [MessageType.SOUND]: "语音",
  [MessageType.VIDEO]: "视频",
  [MessageType.EMOJI]: "表情",
  [MessageType.SYSTEM]: "系统消息",
  [MessageType.AI_CHAT]: "机器人消息",
  [MessageType.DELETE]: "删除消息",
  [MessageType.RTC]: "RTC通讯消息",
};


/**
 * ChatMessageDTO
 */
export interface ChatMessageDTO<T = MessageType> {
  /**
   * 房间id
   */
  roomId: number;
  /**
   * 文本消息（可选）
   */
  content?: string;
  /**
   * 消息类型
   */
  msgType?: MessageType;
  /**
   * 消息内容，类型不同传值不同
   */
  body: any;
  [property: string]: any;
}

interface MessageBodyMap {
  [MessageType.TEXT]: TextBodyDTO;
  [MessageType.IMG]: ImgBodyDTO;
  [MessageType.SOUND]: SoundBodyDTO;
  [MessageType.RECALL]: RecallBodyDTO;
}
export interface TextBodyDTO {
  replyMsgId?: string;
  atUidList?: string[];
}
export interface ImgBodyDTO {
  url: string;
  size?: number;
  width?: number;
  height?: number;
}
export interface SoundBodyDTO {
  fileName: string;
  second: number;
}
export interface RecallBodyDTO {
  recallUid?: string;
  recallTime?: number;
}

export enum ChatReadType {
  /**
   * 已读
   */
  READ = 0,
  /**
   * 未读
   */
  UNREAD = 1,
}


/**
 * 消息已读未读VO
 *
 * ChatMessageReadVO
 */
export interface ChatMessageReadVO {
  /**
   * 已读或者未读的用户uid
   */
  uid?: null | string;
  [property: string]: any;
}
