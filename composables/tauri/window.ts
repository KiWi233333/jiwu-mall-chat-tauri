
import { invoke } from "@tauri-apps/api/core";
import { resolveResource } from "@tauri-apps/api/path";
import { TrayIcon } from "@tauri-apps/api/tray";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export const MAIN_WINDOW_LABEL = "main";
export const LOGIN_WINDOW_LABEL = "login";
export const MSGBOX_WINDOW_LABEL = "msgbox";

/** 消息窗口的宽度 */
export const MSG_WEBVIEW_WIDTH = 240;


export const exitApp = () => invoke("exit_app");

export const windows_map = {
  login: {
    isOpen: true,
    url: "/login",
    label: LOGIN_WINDOW_LABEL,
  },
  main: {
    isOpen: false,
    url: "",
    label: MAIN_WINDOW_LABEL,
  },
  msgbox: {
    isOpen: false,
    url: "/msgbox",
    label: MSGBOX_WINDOW_LABEL,
  },
};

export async function destroyWindow(label: "login" | "main" | "msgbox") {
  const wind = await WebviewWindow.getByLabel(label);
  if (wind) {
    try {
      await wind.destroy();
      return true;
    }
    catch (err) {
      return false;
    }
  }
}

/**
 * 创建指定标签的窗口
 * @param label 窗口标签
 * @returns 是否创建成功
 */
export async function createWindow(label: "login" | "main" | "msgbox"): Promise<boolean> {
  if (label === "login") {
    return await invoke("create_login_window");
  }
  else if (label === "main") {
    return await invoke("create_main_window");
  }
  else if (label === "msgbox") {
    return await invoke("create_msgbox_window");
  }
  return false;
}

export async function showWindow(label: "login" | "main" | "msgbox") {
  const wind = await WebviewWindow.getByLabel(label);
  if (wind) {
    await wind.show();
    await wind.setFocus();
    return wind;
  }
  else {
    return null;
  }
}

export async function hiddenWindow(label: "login" | "main" | "msgbox") {
  return await invoke;
}

export const TrayIconId = "tray_icon";
/**
 * 显示或隐藏闪烁托盘图标。
 */
export async function useFlashTray() {
  const flashTimer = ref<NodeJS.Timeout | null>(null);
  const open = ref(false);
  const activeIcon = ref("icons/icon.png");
  const setting = useSettingStore();
  const iconUrl = await resolveResource("./icons/icon.png");
  const onlineUrl = await resolveResource("./res/online.png");
  const offlineUrl = await resolveResource("./res/offline.png");
  const msgUrl = await resolveResource("./res/msg.png");
  async function setTrayIcon(icon: string | null) {
    const tray = await TrayIcon.getById(TrayIconId).catch((err) => {
      console.error("获取托盘图标失败", err);
    });
    try {
      if (!tray)
        return;
      if (icon === null)
        icon = setting.osType === "linux" ? activeIcon.value : null;
      tray?.setIcon(icon);
    }
    catch (err) {
      console.error("设置托盘图标失败", err);
      tray?.setIcon(iconUrl);
    }
  }

  const stop = async () => {
    if (flashTimer.value) {
      clearInterval(flashTimer.value);
      flashTimer.value = null; // 清空定时器引用
    }
    setTrayIcon(activeIcon.value);
  };

  const start = async (bool: boolean = false, duration: number = 500) => {
    const tray = await TrayIcon.getById(TrayIconId).catch((err) => {
      console.error("获取托盘图标失败", err);
    });

    if (bool && tray) {
      if (flashTimer.value)
        clearInterval(flashTimer.value);
      flashTimer.value = setInterval(() => {
        setTrayIcon(open.value ? null : msgUrl);
        open.value = !open.value;
      }, duration);
    }
    else {
      stop();
    }
  };

  watch(activeIcon, (newVal, oldVal) => {
    if (newVal === oldVal)
      return;
    setTrayIcon(newVal);
  }, { immediate: true });

  return {
    iconUrl,
    onlineUrl,
    offlineUrl,
    msgUrl,
    activeIcon,
    open,
    start,
    stop,
  };
}
