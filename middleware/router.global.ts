// 路由中间件
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useUserStore();
  if (to.path === "/msg")
    return true;

  if (to.path !== "/login") {
    if (!user.getTokenFn() || !user.isLogin) {
      user.showLoginForm = true;
      return "/login";
    }
  }
  else {
    if (user.isLogin)
      return from.path || "/";
  }
});
