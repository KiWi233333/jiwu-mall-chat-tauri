export interface ImportMetaEnv {
  readonly VITE_NODE_ENV: string
  VITE_API_BASE_URL: string
}
// 分页
export interface IPage<T> {
  records: T[]
  total: number
  pages: number
  size: number
  current: number
  orders?: []
  optimizeCountSql?: boolean
  searchCount?: boolean
  maxLimit?: null
  countId?: null
}

// 性别
export enum Gender {
  BOY = "男",
  GIRL = "女",
  DEFAULT = "保密",
}

// 状态
export enum UserStatus {
  TRUE = "正常",
  FALESE = "禁用",
}

// ids
export type ids = string[];


/**
 * 返回数据
 *
 * CursorPage
 */
export interface CursorPage<T> {
  /**
   * 是否最后一页
   */
  isLast: boolean
  /**
   * 数据列表
   */
  list?: T[]
  /**
   * 游标（下次翻页带上这参数）
   */
  cursor: null | string
}
