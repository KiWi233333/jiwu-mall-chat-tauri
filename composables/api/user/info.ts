import type { DeviceType } from ".";
import type { Result, isTrue } from "@/types/result";
import type { Gender, UserStatus } from "~/types";

/**
 * 获取用户个人信息
 * @param token token
 * @returns UserInfoVO
 */
export function getUserInfo(token: string, isAdmin: boolean = false) {
  if (isAdmin) {
    return useHttp.get<Result<UserInfoVO>>("/admin/user/info", {
      headers: {
        Authorization: token,
      },
    });
  }
  return useHttp.get<Result<UserInfoVO>>("/user/info", {}, {
    headers: {
      Authorization: token,
    },
  });
}
export function getUserInfoSSR(token: string, header: Readonly<Record<string, string>>) {
  return useFetch<Result<UserInfoVO>>("/user/info", {
    headers: {
      ...header,
      Authorization: token,
    },
  });
}
export interface UserWallet {
  userId: string
  balance: number
  recharge: number
  spend: number
  points: number
  updateTime: string
  createTime: string
}
export interface UserInfoVO {
  id: string
  username: string
  email?: string
  phone?: string
  nickname: string
  gender?: Gender
  avatar?: string
  birthday?: string
  slogan?: string
  createTime: string
  updateTime: string
  lastLoginTime: string
  lastLoginIp?: string
  status?: UserStatus
  isEmailVerified?: isTrue
  isPhoneVerified?: isTrue
}

/**
 * 用户修改头像
 * @param file 文件
 * @param token
 * @returns
 */
export function updateAvatar(file: any, token: string): Promise<Result<string>> {
  return useHttp.put<Result<string>>(
    "/user/info/avatar", {
    },
    {
      headers: {
        Authorization: token,
      },
      body: file,
    });
}

/**
 * 修改密码
 * @param dto 表单信息
 * @param token 用户身份
 * @returns
 */
export function updatePwdByToken(dto: UpdatePwd, token: string): Promise<Result<string>> {
  return useHttp.put<Result<string>>(
    "/user/info/pwd",
    { ...dto },
    {
      headers: {
        Authorization: token,
      },
    });
}
interface UpdatePwd {
  oldPassword: string
  newPassword: string
}

/**
 * 修改基本信息
 * @param upUserInfo 表单信息
 * @param token 用户身份
 * @returns
 */
export function updateInfoByDTO(upUserInfo: UpdateInfo, token: string): Promise<Result<string>> {
  return useHttp.put<Result<string>>(
    "/user/info",
    { ...upUserInfo },
    {
      headers: {
        Authorization: token,
      },
    });
}
export interface UpdateInfo {
  gender?: Gender
  nickname?: string
  birthday?: string
  slogan?: string
}

export interface UpdatePhone {
  newPhone: string
  code: string
}

/**
 * 获取更换手机号|邮箱验证码
 * @param key 手机号|邮箱
 * @param type 0|1 DeviceType
 * @param token
 * @returns
 */
export function getUpdateNewCode(key: string, type: DeviceType, token: string): Promise<Result<string>> {
  return useHttp.get<Result<string>>(
    `/user/info/code/${key}`,
    { type },
    {
      headers: {
        Authorization: token,
      },
    });
}
/**
 * 更换手机号
 * @param dto 手机号、验证码
 * @param token
 * @returns
 */
export function updatePhone(dto: UpdatePhone, token: string): Promise<Result<string>> {
  return useHttp.put<Result<string>>(
    "/user/info/phone",
    { ...dto },
    {
      headers: {
        Authorization: token,
      },
    });
}

/**
 * 更换邮箱
 * @param dto 邮箱参数
 * @param token
 * @returns
 */
export function updateEmail(dto: UpdateEmail, token: string): Promise<Result<string>> {
  return useHttp.put<Result<string>>(
    "/user/info/email",
    { ...dto },
    {
      headers: {
        Authorization: token,
      },
    },
  );
}
export interface UpdateEmail {
  newEmail: string
  code: string
}
/**
 * 验证-用户名是否存在
 * @param username
 * @returns
 */
export function checkUsernameExists(username: string) {
  return useHttp.get<Result<string>>(
    "/user/exist",
    { username },
  );
};
