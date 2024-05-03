
import type { Result, isTrue } from "@/types/result";
import type { Gender } from "@/types/index";

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
}

/**
 * 消息返回体
 * Date: 2023-03-23
 *
 * ChatMessageVO
 */
export interface ChatMessageVO<T extends object = object> {
  /**
   * 发送者信息
   */
  fromUser: ChatUserInfo
  /**
   * 消息详情
   */
  message: Message<T>
  [property: string]: any
}

/**
 * 发送者信息
 *
 * UserInfo
 */
export interface ChatUserInfo {
  userId: string
  avatar?: null | string
  gender?: Gender
  nickName: string
  [property: string]: any
}
/**
 * 消息详情
 *
 * Message
 */
export interface Message<T extends object = object> {
  id: number
  roomId: number
  sendTime: string
  /**
   * 文本内容
   */
  content?: null | string
  /**
   * 消息类型
   */
  type?: MessageType
  /**
   * 消息内容不同的消息类型，内容体不同，见https://www.yuque.com/snab/mallcaht/rkb2uz5k1qqdmcmd
   */
  body?: T
}

/**
 * 文本消息
 */
export interface TextBodyMsgVO<T = object> {
  content: string
  urlContentMap: { [key: string]: UrlInfoDTO }
  atUidList: string[]
  reply: {
    id: number
    uid: string
    nickName: string
    type: MessageType
    canCallback: isTrue
    gapCount: number
    body?: T
  }
}
export interface UrlInfoDTO {
  title?: string
  description?: string
  /**
   * 网站LOGO
   */
  image?: string

}

/**
 * 图片消息
 */
export interface ImgBodyMsgVO {
  // content: string
  // urlContentMap: { [key: string]: UrlInfoDTO }
  // atUidList: string[]
  url: string
  size?: number
  width?: number
  height?: number
  reply: {
    id: number
    uid: string
    nickName: string
    type: MessageType
    /**
     * 是否可消息跳转 0否 1是
     */
    canCallback: isTrue
    /**
     * 跳转间隔的消息条数
     */
    gapCount: number
    body?: any
  }
}


export enum MessageType {
  TEXT = 1,
  RECALL = 2,
  IMG = 3,
  FILE = 4,
  SOUND = 5,
  VIDEO = 6,
  EMOJI = 7,
  SYSTEM = 8,
  AI_CHAT = 9,
  DELETE = 10,
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
};


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
 * ChatMessageDTO
 */
export interface ChatMessageDTO {
  /**
   * 房间id
   */
  roomId: number
  /**
   * 文本消息（可选）
   */
  content?: null | string
  /**
   * 消息类型
   */
  msgType?: MessageType
  /**
   * 消息内容，类型不同传值不同
   */
  body: MessageType extends infer M
    ? M extends MessageType
      ? M extends keyof Record<string, MessageType>
        ? Record<string, MessageType>[M]
        : { [key: string]: any }
      : { [key: string]: any }
    : { [key: string]: any }
  [property: string]: any
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
  uid?: null | string
  [property: string]: any
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
