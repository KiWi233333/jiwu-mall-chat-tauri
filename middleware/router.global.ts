// 路由中间件
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useUserStore();
  if (to.path !== "/login") {
    if (!user.getTokenFn() || !user.isLogin) {
      user.showLoginForm = true;
      return "/login";
    }
  }
});
