import { type } from "@tauri-apps/plugin-os";

// 路由中间件
export default defineNuxtRouteMiddleware((to, from) => {
  // 消息页
  if ((from.path !== "/msg" && to.path === "/msg")) // 页面进出禁止
    return abortNavigation();
    // 极物圈商品页
    // if (to.path.startsWith("/goods/detail")) {
  //   return abortNavigation();
  // }
  // 移动尺寸
  const setting = useSettingStore();
  if (setting.isMobileSize) {
    // 聊天详情页移动端返回处理
    const chat = useChatStore();
    if (from.path === "/" && to.path !== "/" && !chat.isOpenContact && useSettingStore().isMobileSize) { // 当遇到
      chat.isOpenContact = true;
      return abortNavigation();
    }
    else if (from.path === "/friend" && to.path !== "/friend" && chat.showTheFriendPanel && useSettingStore().isMobileSize) { // 当遇到
      chat.showTheFriendPanel = false;
      return abortNavigation();
    }
  }

  const user = useUserStore();
  // 页面动画
  resolveTransition(to.path, from.path);
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
        user.showLoginAndRegister = "login";
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

const mainRoutes: Record<string, number> = {
  "/": 1,
  "/friend": 2,
  "/ai": 3,
  "/user": 4,
  "/setting": 5,
  // "/user/safe": 6,
};
function resolveTransition(toPath: string, fromPath: string) {
  if (mainRoutes[toPath] && mainRoutes[fromPath]) {
    if (mainRoutes[toPath] > mainRoutes[fromPath]) {
      useChatStore().pageTransition.name = "page-slide-left";
    }
    else if (mainRoutes[toPath] < mainRoutes[fromPath]) {
      useChatStore().pageTransition.name = "page-slide-right";
    }
  }
  else {
    useChatStore().pageTransition.name = "page-fade-in";
  }
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
