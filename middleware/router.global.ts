import { type } from "@tauri-apps/plugin-os";

// 路由中间件
export default defineNuxtRouteMiddleware((to, from) => {
  if ((from.path !== "/msg" && to.path === "/msg")) // 消息页面进出禁止
    return abortNavigation();
  if (to.path !== "/msg") {
    const user = useUserStore();
    // console.log(user.isLogin, "来自", from.path, "去往", to.path);
    if (checkDesktop()) { // 桌面端
      if (!user.isLogin) {
        loadLoginWindow();
        if ((from.path !== "/login" && to.path === "/login")) // 登录页面进出禁止
          return abortNavigation();
        if ((from.path === "/login" && to.path !== "/login")) // 登录页面进出禁止
          return abortNavigation();
      }
      else if (user.isLogin && to.path === "/login") { // 已登录
        return from.path !== "/login" ? abortNavigation() : "/";
      }
      else if (user.isLogin && to.path !== "/login") {
        loadMainWindow();
      }
    }
    else { // 移动、web端
      if (to.path !== "/login") {
        if (!user.isLogin) {
          user.showLoginForm = true;
          return "/login";
        }
      }
      else {
        if (user.isLogin)
          return from.path && from.path !== "/login" ? from.path : "/";
      }
    }
  }
});

const isLoadWind = ref(false);
const step = ref("login");
/**
 * 加载登录页
 */
function loadLoginWindow() {
  if (isLoadWind.value || step.value === "login") {
    return;
  }
  isLoadWind.value = true;
  // 关闭当前
  (async () => {
    try {
      step.value = "login";
      await createWindow("login");
      console.log("login");

      setTimeout(async () => {
        console.log("销毁");
        await destroyWindow("msgbox");
        await destroyWindow("main");
      }, 300);
    }
    catch (e) {
      console.error(e);
    }
    finally {
      isLoadWind.value = false;
    }
  })();
}

/**
 * 加载主页
 */
function loadMainWindow() {
  if (isLoadWind.value || step.value === "main") {
    return;
  }
  isLoadWind.value = true;
  abortNavigation();
  (async () => {
    try {
      step.value = "main";
      await createWindow("msgbox");
      await createWindow("main");
      setTimeout(async () => {
        await destroyWindow("login");
      }, 300);
    }
    catch (e) {
      console.error(e);
    }
    finally {
      isLoadWind.value = false;
    }
  })();
}

function checkDesktop() {
  try {
    const setting = useSettingStore();
    if (setting.isDesktop) {
      return true;
    }
    const osType = type();
    return ["windows", "macos", "linux"].includes(osType);
  }
  catch (error) {
    return false;
  }
}
