
import { useSettingInit, useSettingUnmounted } from "./setting";
import { useAuthInit, userTauriInit } from "./init";
import { useWSUnmounted, useWsInit } from "./ws";


export async function useInit() {
  // 鉴权
  useAuthInit();
  // 设置配置
  useSettingInit();
  // Tauri
  userTauriInit();
  // 会话
  useWsInit();
}
export async function useUmounted() {
  useSettingUnmounted();
  useWSUnmounted();
}
