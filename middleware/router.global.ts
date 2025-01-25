import { type } from "@tauri-apps/plugin-os";

// 路由中间件
export default defineNuxtRouteMiddleware((to, from) => {
  // 消息页
  if ((from.path !== "/msg" && to.path === "/msg")) // 页面进出禁止
    return abortNavigation();
  const user = useUserStore();
  if (checkDesktop()) { // 桌面端
    if ((!from.path.startsWith("/extend") && to.path.startsWith("/extend")) || (to.path.startsWith("/extend") && !user.isLogin)) // 页面进出禁止
      return abortNavigation();
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
      if ((from.path === "/login")) {
        loadMainWindow();
        if (to.path !== "/login") // 登录页面进出禁止
          return abortNavigation();
      }
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
});

/**
 * 加载登录页
 */
function loadLoginWindow() {
  // 关闭当前
  (async () => {
    try {
      await createWindow(LOGIN_WINDOW_LABEL);
      await destroyWindow(MSGBOX_WINDOW_LABEL);
      destroyWindow(MAIN_WINDOW_LABEL);
      destroyWindow(EXTEND_WINDOW_LABEL);
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
    await createWindow(MSGBOX_WINDOW_LABEL);
    await createWindow(MAIN_WINDOW_LABEL);
    await destroyWindow(LOGIN_WINDOW_LABEL);
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
