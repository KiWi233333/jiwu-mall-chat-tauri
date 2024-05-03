import { WebviewWindow } from "@tauri-apps/api/window";


export const windows_map = {
  login: {
    isOpen: false,
    url: "/login",
  },
  main: {
    isOpen: false,
    url: "",
  },
};

/**
 * 跳转到指定的窗口。
 * @param windowsType "login" | "main" 窗口类型，用于区分登录窗口和主窗口。
 */
export function useWindow(windowsType: "login" | "main", successCallback?: () => void, errorCallBack?: () => void) {
  // const webview = new WebviewWindow(windowsType, {
  //   url: windows_map[windowsType].url, // 设置窗口的URL，这里应该根据实际情况进行修改。
  // });
  // webview.once("tauri://created", () => {
  //   // webview window successfully created
  //   windows_map[windowsType].isOpen = true; // 设置窗口打开状态为true。
  //   successCallback?.(); // 执行成功回调函数。
  // });
  // webview.once("tauri://error", (e) => {
  //   // an error occurred during webview window creation
  //   windows_map[windowsType].isOpen = false; // 设置窗口打开状态为true。
  //   errorCallBack?.(); // 执行错误回调函数。
  // });
}
