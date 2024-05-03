import type { Result, isTrue } from "@/types/result";

/**
 * 获取用户登录设备信息列表
 * @param token token
 * @returns Result<DeviceInfo[]>
 */
export function getLoginDeviceList(token: string) {
  return useHttp.get<Result<DeviceInfo[]>>("/user/device", {}, { headers: { Authorization: token } });
}

/**
 * 用户下线
 * @param userAgent
 * @param token
 * @returns Result<number>
 */
export function toUserOffline(userAgent: string[], token: string) {
  return useHttp.deleted<Result<number>>("/user/device", { userAgent }, { headers: { Authorization: token } });
}

// 设备信息
export interface DeviceInfo {
  ip: string
  id: number
  isLocal: isTrue
  browser: string
  userAgentString: string
  operatingSystem: string
  browserVersion: BrowserVersion
}
// 浏览器信息
export interface BrowserVersion {
  version: string
  majorVersion: string
  minorVersion: string
}

/**
 * 获取IP设备信息
 * @param ip 对应ip地址
 * @returns IP信息
 */
export function getDeviceIpInfo(ip: string, token: string) {
  return useHttp.get<Result<DeviceIpInfo>>(`/res/ip/info?ip=${ip}`, {}, {
    headers: {
      Authorization: token,
    },
  });
}

export interface DeviceIpInfo {
  ip: string
  id: number
  city?: null | string
  country?: null | string
  isp?: null | string
  region?: string
  province?: string
  address?: string
  addressAndIsp?: string
  isLocal: isTrue
  browser: string
  userAgentString: string
  operatingSystem: string
  browserVersion: BrowserVersion
  ioCount?: number
  took?: number
  operator?: string
  other?: string
}

export interface IpInfo {
  region: string
  ioCount: number
  took: number
  country: string
  province: string
  city: string
  operator: string
  other: string
}
