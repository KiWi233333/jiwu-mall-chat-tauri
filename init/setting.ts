import { appWindow } from "@tauri-apps/api/window";

export async function useSettingInit() {
  const timer = ref<any>(null);
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
  setting.appUploader.isUpload = false;
  setting.appUploader.version = "";
  setting.appUploader.newVersion = "";
  setting.checkUpdates(true);

  // 3、准备完成关闭加载动画
  const app = document.body;
  if (app)
    app.classList.remove("stop-transition");
  ElMessage.closeAll("error");
  const font = setting.settingPage.fontFamily.value || null;


  // 4、设置字体
  if (font)
    document.documentElement.style.setProperty("--font-family", font);

  // 5、流畅模式
  if (setting.settingPage.isColseAllTransition)
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

  // 6、优化动画性能
  window.addEventListener("resize", () => {
    if (timer.value)
      clearTimeout(timer.value); // 清除之前的定时器，避免重复触发
    const app = document.documentElement;
    if (app)
      app.classList.add("stop-transition");
    timer.value = setTimeout(() => {
      if (app)
        app.classList.remove("stop-transition");
    }, 130);
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
    if ((e.key === "p" && e.ctrlKey) || (e.key === "f" && e.ctrlKey))
      e.preventDefault();
    // esc 最小化窗口
    if (e.key === "Escape" && setting.settingPage.isEscMin && !document.querySelector(".el-image-viewer__wrapper")) {
      e.preventDefault();
      appWindow.minimize();
    }
  });
}
