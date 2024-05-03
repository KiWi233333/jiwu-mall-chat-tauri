// const AuthRoute = [
//   /^\/user\/*/,
//   /^\/order\/*/,
//   /^\/shopcart\/*/,
// ];

import { invoke } from "@tauri-apps/api";

// 路由中间件
export default defineNuxtRouteMiddleware((to, from) => {
  // if (to.path !== "/login") {
  //   if (user.getToken === "" || !user.isLogin)
  //     return "/login";
  // }
  // else {
  //   user.showLoginForm = true;
  // }
  setTimeout(async () => {
    const user = useUserStore();
    if (user.isLogin) {
      user.showLoginForm = false;
      await user.onUserLogin(user.getTokenFn(), true);
      await invoke("close_login_page");
    }
    else {
      user.showLoginForm = true;
      user.clearUserStore();
      await invoke("open_login_page");
    }
  }, 0);
});
