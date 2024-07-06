
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/api/shell";
import { isPermissionGranted, requestPermission } from "@tauri-apps/api/notification";
import type { PayloadType } from "../types/tauri";

/**
 * Tauri事件
 */
export async function userTauriInit() {
  // 监听open_url事件
  listen<PayloadType>("open_url", (e) => {
    const url = e.payload.message; // 路径
    if (url)
      open(url);
  });
  // 监听路由事件
  listen<PayloadType>("router", (e) => {
    const path = e.payload.message; // 路径
    if (path)
      navigateTo(path);
  });

  // 2、获取通知权限
  const setting = useSettingStore();
  let permissionGranted = await isPermissionGranted();
  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === "granted";
    setting.sysPermission.isNotification = permissionGranted; // 更新通知权限状态
  }
  else {
    setting.sysPermission.isNotification = permissionGranted; // 更新通知权限状态
  }
}

/**
 * 初始化用户信息
 */
export async function useAuthInit() {
  const user = useUserStore();
  // 1、确认是否登录
  user.onCheckLogin();
}
