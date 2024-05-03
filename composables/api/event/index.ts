import type { Result } from "@/types/result";

/**
 * 获取活动列表
 * @returns Result
 */
export function getEventsLists() {
  return useFetch<Result<EventVO[]>>(() => `${BaseUrl}/event/list`);
}
/**
 * 获取活动商品列表
 * @param eid 活动id
 */
export function getEventsGoodsList(eid: string) {
  return useFetch<Result<EventGoodsVO[]>>(() => `${BaseUrl}/event/goods/${eid}`);
}

/**
 * 获取活动详情和列表
 * @param eid 活动id
 */
export function getEventsInfo(eid: string) {
  return useFetch<Result<EventInfoVO>>(() => `${BaseUrl}/event/info/${eid}`);
}

export interface EventInfoVO {
  /**
   * 创建时间
   */
  createTime: string
  /**
   * 活动详情
   */
  details: string
  /**
   * 活动结束时间
   */
  endTime: string
  /**
   * 活动ID
   */
  id: string
  /**
   * 活动图片链接
   */
  images: string
  /**
   * 活动级别
   * 权重值（正相关）
   */
  level: number
  /**
   * 活动商品列表
   */
  list: EventGoodsVO[]
  /**
   * 活动开始时间
   */
  startTime: string
  /**
   * 活动状态
   * 活动状态（0表示未开始，1表示正在进行，-1表示已结束）
   */
  status: number
  /**
   * 活动标题
   */
  title: string
  /**
   * 更新时间
   */
  updateTime: string
}

/**
 * 活动商品列表视图类
 *
 * EventGoodsVO
 */
export interface EventGoodsVO {
  id: string
  eventId: string
  eventPrice: number
  isShow?: number
  goodsId: string
  skuId: string
  name: string
  postage?: number
  costPrice: number
  images?: string
  video?: string
  province?: string
  city?: string
  district?: string
  warrantyTime?: number
  refundTime?: number
  isNew: number
  sales: number
  views?: number
  // 库存
  price: number
  stock: number
  image?: string
  createTime?: string
  updateTime?: string
}

/**
 * 获取商品的活动信息
 * @param gid 商品id
 * @returns
 */
export function getEventsGoodsSkuList(gid: string) {
  return useFetch<Result<EventGoodsSeVO[]>>(() => `${BaseUrl}/event/goods/sku/${gid}`);
}

/**
 * 活动商品列表视图类
 *
 * EventGoodsSeVO
 */
export interface EventGoodsSeVO {
  eventId?: string
  eventPrice?: number
  goodsId?: string
  /**
   * 关联数据
   */
  id?: string
  skuId?: string
}
