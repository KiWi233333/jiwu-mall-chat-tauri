import { type } from "@tauri-apps/plugin-os";

// 路由中间件
export default defineNuxtRouteMiddleware((to, from) => {
  if (from.path === "/msg")
    abortNavigation();

  if (to.path !== "/msg") {
    const user = useUserStore();
    // 未登录
    if (!user.isLogin) {
      loadLoginWindow();
      if (to.path !== "/login") {
        return "/login";
      }
    }
    // 已登录
    if (user.isLogin && to.path === "/login") {
      abortNavigation();
    }
    else if (user.isLogin && to.path !== "/login") {
      loadMainWindow();
    }
  }
});

const isLoad = ref(false);
async function loadLoginWindow() {
  try {
    if (checkDesktop()) {
      isLoad.value = true;
      abortNavigation();
      // 关闭当前
      await createWindow("login");
      destroyWindow("main");
      destroyWindow("msgbox");
    }
  }
  catch (error) {
  }
  finally {
    isLoad.value = false;
  }
}

async function loadMainWindow() {
  try {
    isLoad.value = true;
    if (checkDesktop()) {
      abortNavigation();
      destroyWindow("login");
      await createWindow("msgbox");
      await createWindow("main");
    }
  }
  catch (error) {
  }
  finally {
    isLoad.value = false;
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
