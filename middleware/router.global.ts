// 路由中间件
export default defineNuxtRouteMiddleware((to, from) => {
  if (to.path !== "/msg") {
    const user = useUserStore();
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
