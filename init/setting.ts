import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { disable as disableAutoStart, enable as enableAutoStart, isEnabled as isAutoStartEnabled } from "@tauri-apps/plugin-autostart";
import { saveWindowState, StateFlags } from "@tauri-apps/plugin-window-state";

const dev = import.meta.env.MODE === "development";
async function onKeyDown(e: KeyboardEvent) {
  const setting = useSettingStore();
  // 关闭打印 搜索快捷键
  const isReload = e.key === "F5" || (e.key === "R" && e.ctrlKey) || (e.key === "F" && e.ctrlKey && e.shiftKey);
  if ((e.key === "p" && e.ctrlKey) || (e.key === "f" && e.ctrlKey) || (!dev && isReload))
    e.preventDefault();
    // esc 最小化窗口
  if (e.key === "Escape" && setting.settingPage.isEscMin && !document.querySelector(".el-image-viewer__wrapper")) {
    if (!setting.isWeb) {
      e.preventDefault();
      const appWindow = getCurrentWebviewWindow();
      await appWindow.hide();
    }
  }
}

function onContextMenu(e: MouseEvent) {
  e.preventDefault();
}
function onVisibilityChange() {
  const chat = useChatStore();
  const route = useRoute();
  if (route.path === "/")
    chat.isVisible = !document.hidden;
  else
    chat.isVisible = false;
}

export function useSettingInit() {
  const setting = useSettingStore();
  // 1、主题切换
  setting.isThemeChangeLoad = true;
  const colorMode = useColorMode();
  watch(() => [setting.settingPage.modeToggle.value, colorMode.value], (val) => {
    if (!val[0])
      return;
    useModeToggle(val[0], undefined, true);
  });
  nextTick(() => {
    useModeToggle(setting.settingPage.modeToggle.value, undefined, true);
  });
  // 主题切换快捷键
  const onThemeKeyDown = (e: KeyboardEvent) => {
    if (setting.isThemeChangeLoad)
      return;
    keyToggleTheme(e);
  };
  window.addEventListener("keydown", onThemeKeyDown);

  // 2、获取版本更新
  const route = useRoute();
  if (route.path !== "/msg") {
    setting.appUploader.isCheckUpdatateLoad = false;
    setting.appUploader.isUpdating = false;
    setting.appUploader.isUpload = false;
    setting.appUploader.version = "";
    setting.appUploader.newVersion = "";
    setting.appUploader.contentLength = 0;
    setting.appUploader.downloaded = 0;
    setting.appUploader.downloadedText = "";
    setting.checkUpdates();
  }

  // 3、准备完成关闭加载动画
  const app = document.body;
  if (app)
    app.classList.remove("stop-transition");
  ElMessage.closeAll("error");
  const font = setting.settingPage.fontFamily.value || null;

  setting.showDownloadPanel = false;

  // 4、设置字体
  if (font)
    document.documentElement.style.setProperty("--font-family", font);

  // 5、流畅模式
  if (setting.settingPage.isCloseAllTransition)
    document.documentElement.classList.add("stop-transition-all");
  else
    document.documentElement.classList.remove("stop-transition-all");
  if (setting.settingPage.modeToggle.value === "auto") {
    const nowDate = new Date();
    useModeToggle(nowDate.getHours() < 18 && nowDate.getHours() > 6 ? "light" : "dark");
  }
  setTimeout(() => {
    setting.isThemeChangeLoad = false;
  }, 1000);

  // 6、窗口大小变化
  setting.isMobileSize = window.innerWidth < 640;
  const saving = ref(false);
  let timer: NodeJS.Timeout | null = null;
  function onResize() {
    const setting = useSettingStore();
    if (timer)
      clearTimeout(timer); // 清除之前的定时器，避免重复触发
    const app = document.documentElement;
    if (app)
      app.classList.add("stop-transition");

    timer = setTimeout(async () => {
      if (app)
        app.classList.remove("stop-transition");
      setting.isMobileSize = window?.innerWidth <= 768; // 判断是否为移动端
      timer = null;
      if (setting.isDesktop) { // 迁移rust保存
        console.log("save window state");
        if (saving.value) {
          return;
        }
        saving.value = true;
        await saveWindowState(StateFlags.ALL); // 保存窗口状态
        saving.value = false;
      }
    }, 200);
  }
  window.addEventListener("resize", onResize);

  // 7、页面加载完整后，滚动到底部
  setTimeout(() => {
    nextTick(() => {
      const chat = useChatStore();
      chat?.scrollBottom(false);
    });
  }, 0);

  // 消息通知
  if (setting.isWeb) {
    setting.settingPage.isTrayNotification = false;
  }

  // 8、自动重启
  isAutoStartEnabled().then((isAutoStart) => {
    setting.settingPage.isAutoStart = isAutoStart;
  }).catch(() => {
    setting.settingPage.isAutoStart = false;
  });
  watch(() => setting.settingPage.isAutoStart, async (val) => {
    try {
      if (val)
        await enableAutoStart();
      else
        await disableAutoStart();
    }
    catch (error) {
      console.warn(error);
    }
  });

  return () => {
    window.removeEventListener("resize", onResize);
    window.removeEventListener("keydown", onThemeKeyDown);
    const setting = useSettingStore();
    setting.appUploader.isCheckUpdatateLoad = false;
    setting.appUploader.isUpdating = false;
    setting.appUploader.isUpload = false;
  };
}

function keyToggleTheme(e: KeyboardEvent) {
  if (e?.altKey && e?.key && e?.key === "k") {
    // 获取
    const dom = document.querySelector("#toggle-theme-btn");
    // 计算屏幕中心坐标
    const centerY = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight);
    const xy = dom?.getBoundingClientRect?.();
    if (!xy) {
      return;
    }
    const colorMode = useColorMode();
    const mode = colorMode.value === "dark" ? "light" : "dark";
    const setting = useSettingStore();
    // 持久化
    setting.settingPage.modeToggle.value = mode;

    useModeToggle(mode, (dom && xy
      ? {
          // 按钮 x y 坐标、
          clientX: xy.x + 10,
          clientY: xy.y + 10,
        }
      : {
          clientX: 40,
          clientY: +centerY - 40,
        }) as MouseEvent);
  }
}

/**
 * 初始化快捷键
 */
export function useHotkeyInit() {
  // 阻止默认行为，防止右键菜单弹出
  window.addEventListener("contextmenu", onContextMenu);
  // 快捷键阻止
  window.addEventListener("keydown", onKeyDown);

  return () => {
    window.removeEventListener("contextmenu", onContextMenu);
    window.removeEventListener("keydown", onKeyDown);
  };
}


/**
 * 初始化窗口监听可见性
 */
export function useWindowVisibilityInit() {
  const chat = useChatStore();
  chat.isVisible = true;
  document.addEventListener("visibilitychange", onVisibilityChange);
  return () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
