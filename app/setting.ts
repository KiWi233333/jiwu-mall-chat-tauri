import { isPermissionGranted, requestPermission } from "@tauri-apps/api/notification";
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
  setting.appUploader.isUpdatateLoad = false;
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
      clearTimeout(timer.value);// 清除之前的定时器，避免重复触发
    const app = document.documentElement;
    if (app)
      app.classList.add("stop-transition");
    timer.value = setTimeout(() => {
      const app = document.documentElement;
      if (app)
        app.classList.remove("stop-transition");
    }, 600);
  });

  // 7、阻止默认行为，防止右键菜单弹出
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
  window.addEventListener("keydown", (e) => {
    //   if (e.key === "F5")
    //     e.preventDefault();
    if (e.key === "Escape" && setting.settingPage.isEscMin)
      appWindow.minimize();
  });

  // 8、获取通知权限
  let permissionGranted = await isPermissionGranted();
  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === "granted";
    setting.sysPermission.isNotification = permissionGranted; // 更新通知权限状态
  }
  else {
    setting.sysPermission.isNotification = permissionGranted; // 更新通知权限状态
  }
}

function keyToggleTheme(e: KeyboardEvent) {
  if (e?.altKey && e?.key && e?.key === "k") {
    // 获取
    const dom = document.querySelector("#toggle-theme-btn");
    // 计算屏幕中心坐标
    const centerY = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight);
    const xy = dom?.getBoundingClientRect();
    const colorMode = useColorMode();
    useModeToggle(colorMode.preference === "dark" ? "light" : "dark", (dom && xy
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


export function useSettingUnmounted() {
  window.removeEventListener("resize", () => {});
  window.removeEventListener("contextmenu", () => {});
  window.removeEventListener("keydown", () => {});
}
