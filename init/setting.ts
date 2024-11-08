import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { disable as disableAutoStart, enable as enableAutoStart, isEnabled as isAutoStartEnabled } from "@tauri-apps/plugin-autostart";


export async function useSettingInit() {
  const setting = useSettingStore();
  // 1、主题切换
  setting.isThemeChangeLoad = true;
  watch(() => setting.settingPage.modeToggle.value, (val) => {
    const nowDate = new Date();
    if (val === "auto")
      useModeToggle(nowDate.getHours() < 18 && nowDate.getHours() > 6 ? "light" : "dark");
  }, {
    immediate: true,
  });
  window.addEventListener("keydown", (e) => {
    if (setting.isThemeChangeLoad)
      return;
    keyToggleTheme(e);
  });
  // 2、获取版本更新
  setting.appUploader.isCheckUpdatateLoad = false;
  setting.appUploader.isUpdating = false;
  setting.appUploader.isUpload = false;
  setting.appUploader.version = "";
  setting.appUploader.newVersion = "";
  setting.appUploader.contentLength = 0;
  setting.appUploader.downloaded = 0;
  setting.appUploader.downloadedText = "";
  setting.checkUpdates();

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

  let timer: NodeJS.Timeout | null = null;
  // 6、优化动画性能
  window.addEventListener("resize", () => {
    if (timer)
      clearTimeout(timer); // 清除之前的定时器，避免重复触发
    const app = document.documentElement;
    if (app)
      app.classList.add("stop-transition");

    timer = setTimeout(() => {
      if (app)
        app.classList.remove("stop-transition");
      setting.isMobile = window.innerWidth < 640;
      timer = null;
    }, 150);
  });

  // 7、页面加载完整后，滚动到底部
  setTimeout(() => {
    nextTick(() => {
      const chat = useChatStore();
      chat?.scrollBottom(false);
    });
  }, 0);

  // 8、自动重启
  try {
    const isAutoStart = await isAutoStartEnabled();
    setting.settingPage.isAutoStart = isAutoStart;
  }
  catch (error) {
    setting.settingPage.isAutoStart = false;
    // console.warn(error);
  }
  watch(() => setting.settingPage.isAutoStart, async (val) => {
    if (val)
      await enableAutoStart();
    else
      await disableAutoStart();
  });
}

function keyToggleTheme(e: KeyboardEvent) {
  if (e?.altKey && e?.key && e?.key === "k") {
    // 获取
    const dom = document.querySelector("#toggle-theme-btn");
    // 计算屏幕中心坐标
    const centerY = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight);
    const xy = dom?.getBoundingClientRect();
    const colorMode = useColorMode();
    const mode = colorMode.preference === "dark" ? "light" : "dark";
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
 * 卸载设置
 */
export function useSettingUnmounted() {
  window.removeEventListener("resize", () => {});
  window.removeEventListener("contextmenu", () => {});
  window.removeEventListener("keydown", () => {});
  const setting = useSettingStore();
  setting.appUploader.isCheckUpdatateLoad = false;
  setting.appUploader.isUpdating = false;
  setting.appUploader.isUpload = false;
}


const dev = import.meta.env.MODE === "development";
/**
 * 初始化快捷键
 */
export async function useHotkeyInit() {
  const setting = useSettingStore();
  // 阻止默认行为，防止右键菜单弹出
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
  // 快捷键阻止
  window.addEventListener("keydown", (e) => {
    // 关闭打印 搜索快捷键
    const isReload = e.key === "F5" || (e.key === "R" && e.ctrlKey) || (e.key === "F" && e.ctrlKey && e.shiftKey);
    if ((e.key === "p" && e.ctrlKey) || (e.key === "f" && e.ctrlKey) || (!dev && isReload))
      e.preventDefault();
    // esc 最小化窗口
    if (e.key === "Escape" && setting.settingPage.isEscMin && !document.querySelector(".el-image-viewer__wrapper")) {
      if (!setting.isWeb) {
        e.preventDefault();
        const appWindow = getCurrentWebviewWindow();
        appWindow.minimize();
      }
    }
  });
}


/**
 * 初始化窗口监听可见性
 */
export function useWindowVisibilityInit() {
  const chat = useChatStore();
  chat.isVisible = true;
  document.addEventListener("visibilitychange", () => {
    const route = useRoute();
    if (route.path === "/")
      chat.isVisible = !document.hidden;
    else
      chat.isVisible = false;
  });
}

export function useWindowVisibilityInitUnmounted() {
  const chat = useChatStore();
  chat.isVisible = true;
  document.removeEventListener("visibilitychange", () => {});
}
