import type { ChatRoomRoleEnum } from "./room";
import type { Result } from "@/types/result";

/**
 * 获取会话列表（游标）
 * @param pageSize 大小
 * @param cursor 游标
 * @param token token
 * @returns 分页
 */
export function getChatContactPage(dto: ContactPageDTO, token: string) {
  return useHttp.get<Result<CursorPage<ChatContactVO>>>(
    "/chat/contact/page",
    {
      pageSize: dto.pageSize,
      cursor: dto.cursor,
      type: dto.type,
    },
    {
      headers: {
        Authorization: token,
      },
    },
  );
}

export interface ContactPageDTO {
  pageSize: number
  cursor?: string | null | undefined
  type?: RoomType | null | undefined
}

/**
 * 会话VO
 *
 * ChatContactVO
 */
export interface ChatContactVO {
  /**
   * 房间最后活跃时间(用来排序)
   */
  activeTime: number
  /**
   * 会话头像
   */
  avatar: string
  /**
   * 是否全员展示的会话 0否 1是
   */
  hotFlag: number
  /**
   * 会话名称
   */
  name: string
  /**
   * 房间id
   */
  roomId: number
  /**
   * 最新消息
   */
  text: string
  /**
   * 房间类型 1群聊 2单聊 3AI聊
   */
  type: RoomType
  /**
   * 未读数
   */
  unreadCount: number
  [property: string]: any

}

export enum RoomType {
  /**
   * 群聊
   */
  GROUP = 1,
  /**
   * 单聊
   */
  SELFT = 2,

  AICHAT = 3,
}


/**
 * 会话详情
 * @param id 房间号|好友id
 * @param roomType RoomType
 * @param token token
 * @returns 分页
 */
export function getChatContactInfo(id: number | string, roomType: RoomType = RoomType.GROUP, token: string) {
  if (roomType === RoomType.GROUP) {
    return useHttp.get<Result<ChatContactDetailVO>>(
      `/chat/contact/${id}`,
      { },
      {
        headers: {
          Authorization: token,
        },
      },
    );
  }
  else if (roomType === RoomType.SELFT) {
    return useHttp.get<Result<ChatContactDetailVO>>(
      `/chat/contact/self/${id}`,
      { },
      {
        headers: {
          Authorization: token,
        },
      },
    );
  }
}


export interface ChatContactDetailVO extends ChatContactVO {
  /**
   * 角色信息
   */
  member?: ChatGroupMember
  /**
   * 详细信息
   */
  roomGroup?: ChatRoomGroup
}


/**
 * 角色信息
 *
 * ChatGroupMember
 */
export interface ChatGroupMember {
  /**
   * 成员uid
   */
  userId: string
  /**
   * 群组id
   */
  groupId: number
  /**
   * id
   */
  id: number
  /**
   * 成员角色1群主(可撤回，可移除，可解散，可发系统通知) 2管理员(可撤回，可移除) 3普通成员
   */
  role?: ChatRoomRoleEnum
  /**
   * 更新时间
   */
  updateTime?: string
  /**
   * 创建时间
   */
  createTime: string
}

/**
 * 详细信息
 *
 * ChatRoomGroup
 */
export interface ChatRoomGroup {
  /**
   * 群头像
   */
  avatar?: string
  /**
   * 创建时间
   */
  createTime: string
  /**
   * 逻辑删除
   */
  deleteStatus: number
  /**
   * 额外信息（根据不同类型房间有不同存储的东西）
   */
  extJson?: string
  /**
   * id
   */
  id: number
  /**
   * 群名称
   */
  name: string
  /**
   * 房间Id
   */
  roomId: number
  /**
   * 修改时间
   */
  updateTime?: string
}
