import type { Result } from "@/types/result";

/**
 * 获取社区帖子评论列表（分页）
 * @param pid 帖子id
 * @param page 页码
 * @param size 每页个数
 * @param dto 筛选参数
 * @returns Result<IPage<CommCommentInfo>>
 */
export function getCommCommentPage(pid: string, page: number, size: number, dto: SelectCommPostCommentDTO) {
  return useHttp.post<Result<IPage<CommCommentInfo>>>(
    `/community/post/comment/list/${pid}/${page}/${size}`,
    { ...dto }, {},
  );
}

/**
 * SelectCommPostCommentDTO
 */
export interface SelectCommPostCommentDTO {
  /**
   * 是否最热
   */
  isHot?: number | null
  /**
   * 是否最新
   */
  isNew?: number | null
  [property: string]: any
}

/**
 * 社区评论信息
 *
 * CommCommentInfo
 */
// 评论类型
export interface CommCommentInfo {
  id: string // 评论ID
  postId: string // 所属文章ID
  userId: string // 评论者ID
  parentId?: string // 父评论ID，如果没有则为null
  content: string // 评论内容
  images?: any // 图片信息，如果没有则为null ","分割
  views: number // 评论浏览量
  likes: number // 评论点赞数
  createTime: string // 评论创建时间
  updateTime: string // 评论更新时间
  user: CommentUserSeVO // 评论者信息
  children?: CommCommentInfo[] // 子评论列表
}

// 用户类型
export interface CommentUserSeVO {
  username?: string // 用户名
  nickname?: string // 用户昵称
  gender?: string // 用户性别
  avatar?: string // 用户头像URL
  slogan?: string // 用户口号
  lastLoginIp?: string // 用户最后一次登录IP地址
  birthday?: string // 用户生日
}

/**
 * 添加帖子评论
 * @param pid 帖子id
 * @param dto 参数
 * @param token token
 * @returns 影响行
 */
export function addCommComment(pid: string, dto: InsertPostCommentDTO, token: string) {
  return useHttp.post<Result<CommCommentInfo>>(`/community/post/comment/${pid}`, {
    ...dto,
  }, {
    headers: {
      Authorization: token,
    },
  });
}
/**
 * InsertPostCommentDTO
 */
export interface InsertPostCommentDTO {
  /**
   * 评论内容
   */
  content: string
  images?: string[] | null
  /**
   * 评论对象id
   */
  parentId?: string
  [property: string]: any
}


/**
 * 添加评论数据
 *
 * RefundCommPostCommentVO
 */
export interface RefundCommPostCommentVO {
  /**
   * 内容
   */
  content?: string
  createTime?: string
  id: string
  images?: string
  likes?: number | null
  /**
   * 评论对象id
   */
  parentId?: string
  /**
   * 帖子id
   */
  postId?: string
  updateTime?: string
  /**
   * 用户id
   */
  userId?: string
  views?: null
}

/**
 * 删除帖子评论
 * @param pid 帖子id
 * @param id 评论id
 * @param token token
 * @returns 影响行
 */
export function delCommComment(pid: string, id: string, token: string) {
  return useHttp.deleted<Result<number>>(`/community/post/comment/${pid}/${id}`, {}, {
    headers: {
      Authorization: token,
    },
  });
}
