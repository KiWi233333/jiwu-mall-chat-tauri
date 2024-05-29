// 路由中间件
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useUserStore();
  if (to.path !== "/login") {
    if (!user.getTokenFn() || !user.isLogin)
      return "/login";
  }
  else {
    user.showLoginForm = true;
  }
});
