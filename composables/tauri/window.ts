
import { TrayIcon } from "@tauri-apps/api/tray";

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


export const TrayIconId = "tray_icon";
/**
 * 显示或隐藏闪烁托盘图标。
 */
export function useFlashTray() {
  const flashTimer = ref<NodeJS.Timeout | null>(null);
  const open = ref(false);
  const activeIcon = ref("icons/icon.png");

  const stop = async () => {
    if (flashTimer.value) {
      clearInterval(flashTimer.value);
      flashTimer.value = null; // 清空定时器引用
    }
    const tray = await TrayIcon.getById(TrayIconId).catch((err) => {
      console.error("获取托盘图标失败", err);
    });
    tray?.setIcon(activeIcon.value);
  };

  const start = async (bool: boolean = false, duration: number = 500) => {
    const tray = await TrayIcon.getById(TrayIconId).catch((err) => {
      console.error("获取托盘图标失败", err);
    });

    if (bool && tray) {
      if (flashTimer.value)
        clearInterval(flashTimer.value);

      flashTimer.value = setInterval(() => {
        tray.setIcon(open.value ? null : "icons/msg.png");
        open.value = !open.value;
      }, duration);
    }
    else {
      stop();
    }
  };

  return {
    activeIcon,
    open,
    start,
    stop,
  };
}
