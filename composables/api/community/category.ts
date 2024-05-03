import type { Result } from "@/types/result";

/**
 * 获取帖子分类列表
 * @returns Result
 */
export function getCommCategory() {
  return useFetch<Result<CommCategory[]>>(() => `${BaseUrl}/community/category/tree`);
}
/**
 * 获取帖子分类列表
 * @returns Result
 */
export function getCommCategoryList() {
  return useHttp.get<Result<CommCategory[]>>(`${BaseUrl}/community/category/list`);
}
/**
 * 社区圈子分类表
 *
 * CommCategory
 */
export interface CommCategory {
  id: string
  /**
   * 对应图标
   */
  image?: string
  /**
   * 是否展示
   */
  isShow?: number
  name: string
  /**
   * 父id
   */
  parentId?: string
  /**
   * 权重
   */
  sortOrder?: number
  updateTime?: string
  createTime?: string
  /**
   * 用于数据处理生成的子树
   */
  children?: CommCategory[]
}


/**
 * 获取帖子分类
 * @param id 帖子id
 * @returns Result
 */
export function getCommPostCategoryById(id: string) {
  return useHttp.get<Result<CommCategory>>(`/community/category/post/${id}`);
}

/**
 * 获取分类详情
 * @param id 分类id
 * @returns Result
 */
export function getCommCategoryById(id: string) {
  return useHttp.get<Result<CommCategory>>(`/community/category/one/${id}`);
}
