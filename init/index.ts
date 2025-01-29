
import { useIframeInit } from "./iframe";
import { useAuthInit, useMsgBoxWebViewInit, userTauriInit } from "./init";
import { useHotkeyInit, useSettingInit, useWindowVisibilityInit } from "./setting";
import { initSystemConstant } from "./system";
import { useWsInit, useWSUnmounted } from "./ws";

let unMountedMsgBoxWebView: (() => void) | undefined;
let unMountedTauri: (() => void) | undefined;
let unMountedSettingInit: (() => void) | undefined;
let unMountedHotkeyInit: (() => void) | undefined;
let unMoundtedIframeInit: (() => void) | undefined;
let unMountedWindowVisibilityInit: (() => void) | undefined;


/**
 * 通用初始化
 */
export async function useDefaultInit() {
  // 鉴权
  useAuthInit();
  // 系统常量
  initSystemConstant();
  // 初始化窗口可见性
  unMountedWindowVisibilityInit = useWindowVisibilityInit();
  // 设置配置
  unMountedSettingInit = useSettingInit();
  // 初始化快捷键
  unMountedHotkeyInit = useHotkeyInit();
  // iframe通信
  unMoundtedIframeInit = useIframeInit();
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
  unMountedTauri?.();
  useWSUnmounted?.();
  unMountedMsgBoxWebView?.();

  unMountedSettingInit?.();
  unMountedHotkeyInit?.();
  unMoundtedIframeInit?.();
  unMountedWindowVisibilityInit?.();
}
