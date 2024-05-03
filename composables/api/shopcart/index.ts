import type { Result } from "@/types/result";
import { Sort, isTrue } from "@/types/result";
import type { IPage } from "~/types";

/**
 * 获取购物车
 * @param page
 * @param size
 * @param token
 * @returns
 */
export function getUserShopCartPage(page: number, size: number, token: string) {
  return useHttp.get<Result<IPage<ShopcartVO>>>(`/user/cart/${page}/${size}`,
    {},
    {
      headers: {
        Authorization: token,
      },
    });
}

export interface ShopcartVO {
  id: string
  name: string
  skuId: string
  goodsId: string
  size?: string
  color?: string
  combo?: string
  stock: number
  price: number
  costPrice: number
  postage?: number
  image?: string
  description?: string
  quantity: number
  activityId?: any
  shopId?: any
  createTime?: string
  updateTime?: string
}

/**
 * 用户添加购物车
 * @param dto 购物车DTO
 * @param token
 * @returns
 */
export function addShopcart(dto: ShopcartDTO, token: string) {
  return useHttp.post<Result<string>>("/user/cart/",
    { ...dto },
    {
      headers: {
        Authorization: token,
      },
    });
}
// 添加购物车DTO
export interface ShopcartDTO {
  skuId: string
  quantity: number
}


/**
 * 更新购物车
 * @param id 购物车id
 * @param dto 更新购物车DTO
 * @param token
 * @returns
 */
export function updateShopcart(id: string, dto: updateShopcartDTO, token: string) {
  return useHttp.put<Result<string>>(`/user/cart/${id}`,
    { ...dto },
    {
      headers: {
        Authorization: token,
      },
    });
}
export interface updateShopcartDTO {
  skuId: string
  quantity: number
}


/**
 * 删除购物车（单个）
 * @param id 购物车id
 * @param token
 *
 */
export function deleteShopcart(id: string, token: string) {
  return useHttp.deleted<Result<string>>(`/user/cart/one/${id}`,
    {},
    {
      headers: {
        Authorization: token,
      },
    });
}


/**
 * 删除购物车（批量）
 * @param ids 删除购物车id列表
 * @param token
 * @returns
 */
export function deleteBatchShopcartByIds(ids: string[], token: string) {
  return useHttp.deleted<Result<string>>("/user/cart/some",
    {
      ids,
    },
    {
      headers: {
        Authorization: token,
      },
    });
}
