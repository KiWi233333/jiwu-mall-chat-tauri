
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-shell";
import { isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";
import { platform } from "@tauri-apps/plugin-os";
import { appDataDir } from "@tauri-apps/api/path";
import { StateFlags, restoreStateCurrent, saveWindowState } from "@tauri-apps/plugin-window-state";
import type { PayloadType } from "../types/tauri";

/**
 * Tauri事件
 */
export async function userTauriInit() {
  const setting = useSettingStore();
  try {
    const appPlatform = platform();
    if (!appPlatform)
      return;
    setting.appPlatform = appPlatform;
  }
  catch (error) {
    console.warn(error);
    setting.appPlatform = "web";
    return;
  }
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
  let permissionGranted = await isPermissionGranted();
  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === "granted";
    setting.sysPermission.isNotification = permissionGranted; // 更新通知权限状态
  }
  else {
    setting.sysPermission.isNotification = permissionGranted; // 更新通知权限状态
  }

  // 3、获取文件路径
  if (!await existsFile(setting.appDataDownloadDirUrl))
    setting.appDataDownloadDirUrl = `${await appDataDir()}\\downloads`;
  // 4、初始化窗口
  try {
    platform();
    restoreStateCurrent(StateFlags.ALL);
  }
  catch (error) { // web端兼容
    console.warn(error);
  }
  watch(() => [
    setting.isMobile,
  ], () => {
    saveWindowState(StateFlags.ALL);
  }, {
    immediate: true,
  });
}

/**
 * 初始化用户信息
 */
export async function useAuthInit() {
  const user = useUserStore();
  // 用于iframe嵌入快速登录
  const route = useRoute();
  const token = route.query.token;
  if (token && !user.isLogin) {
    let loading = {} as any;
    loading = ElLoading.service({ fullscreen: true, text: "正在登录，请稍等..." });
    user.onUserLogin(String(token), true, "/", () => {
      setTimeout(() => {
        loading?.close?.();
      }, 300);
    });
  }
  else {
    // 确认是否登录
    user.onCheckLogin();
  }
}
