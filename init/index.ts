
import { useIframeInit } from "./iframe";
import { useAuthInit, useMsgBoxWebViewInit, userTauriInit } from "./init";
import { useHotkeyInit, useSettingInit, useSettingUnmounted, useWindowVisibilityInit, useWindowVisibilityInitUnmounted } from "./setting";
import { useWsInit, useWSUnmounted } from "./ws";

let unMountedMsgBoxWebView: (() => void) | undefined;
let unMountedTauri: (() => void) | undefined;


/**
 * 通用初始化
 */
export async function useDefaultInit() {
  // 鉴权
  useAuthInit();
  // 初始化窗口可见性
  useWindowVisibilityInit();
  // 设置配置
  useSettingInit();
  // 初始化快捷键
  useHotkeyInit();
  // iframe通信
  useIframeInit();
}

/**
 * 初始化
 */
export async function useInit() {
  // 通用初始化
  useDefaultInit();
  // Tauri
  userTauriInit().then((call) => {
    unMountedTauri = call || (() => {});
  });
  // 会话
  useWsInit();
  // 窗口
  unMountedMsgBoxWebView = await useMsgBoxWebViewInit();
}

// 卸载
export async function useUmounted() {
  useSettingUnmounted?.();
  unMountedTauri?.();
  useWSUnmounted?.();
  unMountedMsgBoxWebView?.();
  useWindowVisibilityInitUnmounted?.();
}
