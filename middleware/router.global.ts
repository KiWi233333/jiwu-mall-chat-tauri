// const AuthRoute = [
//   /^\/user\/*/,
//   /^\/order\/*/,
//   /^\/shopcart\/*/,
// ];
// 路由中间件
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useUserStore();
  if (to.path !== "/login") {
    if (user.getToken === "" || !user.isLogin)
      return "/login";
  }
  else {
    user.showLoginForm = true;
  }
});
