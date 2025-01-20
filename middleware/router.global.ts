import { type } from "@tauri-apps/plugin-os";

// 路由中间件
export default defineNuxtRouteMiddleware((to, from) => {
  if ((from.path !== "/msg" && to.path === "/msg")) // 消息页面进出禁止
    return abortNavigation();
  if (to.path !== "/msg") {
    const user = useUserStore();
    if (checkDesktop()) { // 桌面端
      if (!user.isLogin) {
        loadLoginWindow();
        if ((from.path !== "/login" && to.path === "/login")) // 登录页面进出禁止
          return abortNavigation();
        if ((from.path === "/login" && to.path !== "/login")) // 登录页面进出禁止
          return abortNavigation();
      }
      else {
        if ((from.path !== "/login" && to.path === "/login")) // 主页页面进出禁止
          return abortNavigation();
        if ((from.path === "/login")) // 登录页面进出禁止
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

/**
 * 加载登录页
 */
function loadLoginWindow() {
  // 关闭当前
  (async () => {
    try {
      await createWindow("login");
      setTimeout(() => {
        destroyWindow("msgbox");
        destroyWindow("main");
      }, 500);
    }
    catch (e) {
      console.error(e);
    }
  })();
}

/**
 * 加载主页
 */
async function loadMainWindow() {
  try {
    await createWindow("msgbox");
    await createWindow("main");
    setTimeout(() => {
      destroyWindow("login");
    }, 1000);
  }
  catch (e) {
    console.error(e);
  }
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
