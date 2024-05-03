import type { isTrue } from "../result";


// 简约商品视图对象
export interface GoodsVO {
  id: string
  categoryId: string
  city: string
  costPrice: number
  createTime: string
  description: string
  district: null
  images: string | string[]
  isShow: isTrue
  name: string
  postage: number
  price: number
  province: string
  refundTime: number
  sales: number
  updateTime: string
  video: string
  views: number
  warrantyTime: number
}
