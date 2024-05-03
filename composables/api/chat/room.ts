import type { Result } from "@/types/result";

/**
 * 获取房间详细信息
 * @param id 房间号
 * @param token token
 * @returns 分页
 */
export function getRoomGroupInfo(id = 10, token: string) {
  return useHttp.get<Result<ChatRoomInfoVO>>(
    `/chat/room/group/${id}`,
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
 * 返回数据
 *
 * ChatRoomInfoVO
 */
export interface ChatRoomInfoVO {
  /**
   * 群头像
   */
  avatar?: null | string
  /**
   * 群名称
   */
  groupName?: null | string
  /**
   * 在线人数
   */
  onlineNum?: number | null
  /**
   * 房间id
   */
  roomId?: number | null
}

/**
 * 获取成员列表（游标）
 * @param roomId 房间号
 * @param pageSize 大小
 * @param cursor 游标
 * @param token token
 * @returns 分页
 */
export function getRoomGroupUserPage(roomId: number | null = null, pageSize = 10, cursor: string | number | null = null, token: string) {
  return useHttp.get<Result<CursorPage<ChatMemberVO>>>(
    "/chat/room/group/member/page",
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


export interface ChatATMemberVO {

  /**
   * userId
   */
  userId: string
  avatar: string
  nickName: string
}

/**
 * Description: 群成员列表的成员信息
 *
 * ChatMemberVO
 */
export interface ChatMemberVO {
  /**
   * userId
   */
  userId: string
  avatar: string
  nickName: string
  /**
   * 在线状态 1在线 0离线
   */
  activeStatus: ChatOfflineType
  /**
   * 最后一次上下线时间
   */
  lastOptTime?: null | string
  /**
   * 角色ID
   */
  roleType?: ChatRoomRoleEnum | null
}
export enum ChatOfflineType {
  ONLINE = 1,
  OFFLINE = 0,
}
export enum ChatRoomRoleEnum {
  /**
   * 群主
   */
  OWNER = 1,
  /**
   * 管理员
   */
  ADMIN = 2,
  /**
   * 普通成员
   */
  MEMBER = 3,
}

export const ChatRoomRoleEnumMap = {
  [ChatRoomRoleEnum.OWNER]: "群主",
  [ChatRoomRoleEnum.ADMIN]: "管理员",
  [ChatRoomRoleEnum.MEMBER]: "成员",
};


/**
 * 获取所有成员列表（@专用）
 * @param roomId 房间号
 * @param token token
 * @returns 分页
 */
export function getRoomGroupAllUser(roomId: number, token: string) {
  return useFetch<Result<ChatMemberVO[]>>(
    `${BaseUrl}/chat/room/group/member/list/${roomId}`,
    {
      headers: {
        Authorization: token,
      },
    },
  );
}

/**
 * 添加群聊（拉起）
 * @param dto 参数
 * @param token 用户token
 * @returns 参数
 */
export function addNewGroupRoom(dto: NewGroupRoomDTO, token: string) {
  return useHttp.post<Result<InsertRoomGroupVO>>(
    "/chat/room/group",
    dto,
    {
      headers: {
        Authorization: token,
      },
    },
  );
}
/**
 * InsertRoomGroupDTO
 */
export interface NewGroupRoomDTO {
  /**
   * 邀请的uid
   */
  uidList: string[]
}

export interface InsertRoomGroupVO {
  id: number // 房间号
}


/**
 * 邀请群成员
 * @param dto 参数
 * @param token 用户token
 * @returns 参数
 */
export function addGroupMember(dto: AddGroupMemberDTO, token: string) {
  return useHttp.post<Result<InsertRoomGroupVO>>(
    "/chat/room/group/member",
    dto,
    {
      headers: {
        Authorization: token,
      },
    },
  );
}
export interface AddGroupMemberDTO {

  roomId: number // 房间号
  /**
   * 邀请的uid
   */
  uidList: string[]

}

/**
 * 退出群聊
 * @param roomId 房间号
 * @param token 身份
 * @returns 影响
 */
export function exitRoomGroup(roomId: number, token: string) {
  return useHttp.deleted<Result<number>>(
    `/chat/room/group/member/exit/${roomId}`,
    {},
    {
      headers: {
        Authorization: token,
      },
    },
  );
}


/**
 * 移除成员
 * @param roomId 房间号
 * @param uid 目标用户id
 * @param token 身份
 * @returns 影响
 */
export function exitRoomGroupByUid(roomId: number, uid: string, token: string) {
  return useHttp.deleted<Result<number>>(
    `/chat/room/group/member/${roomId}/${uid}`,
    {},
    {
      headers: {
        Authorization: token,
      },
    },
  );
}


/**
 * 添加群聊管理员
 * @param dto 参数
 * @param token 身份
 * @returns 影响
 */
export function addChatRoomAdmin(dto: ChatRoomAdminAddDTO, token: string) {
  return useHttp.put<Result<number>>(
    "/chat/room/group/admin",
    dto,
    {
      headers: {
        Authorization: token,
      },
    },
  );
}


/**
 * ChatRoomAdminAddDTO
 */
export interface ChatRoomAdminAddDTO {
  /**
   * 房间id
   */
  roomId: number
  /**
   * 用户id
   */
  userId: string
  [property: string]: any
}


/**
 * 撤销群聊管理员
 * @param dto 参数
 * @param token 身份
 * @returns 影响
 */
export function delChatRoomAdmin(dto: ChatRoomAdminAddDTO, token: string) {
  return useHttp.deleted<Result<number>>(
    "/chat/room/group/admin",
    {},
    {
      headers: {
        Authorization: token,
      },
      params: {
        ...dto,
      },
    },
  );
}
