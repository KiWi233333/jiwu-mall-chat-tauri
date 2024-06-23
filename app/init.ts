
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/api/shell";
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
}

/**
 * 初始化用户信息
 */
export async function useAuthInit() {
  const user = useUserStore();
  // 1、确认是否登录
  user.onCheckLogin();
}
