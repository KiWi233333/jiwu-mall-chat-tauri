
import { resolveResource } from "@tauri-apps/api/path";
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
