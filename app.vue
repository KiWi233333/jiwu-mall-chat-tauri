<script setup lang="ts">
import { appKeywords, appName } from "@/constants/index";

// 1、确认是否登录
const user = useUserStore();
const setting = useSettingStore();
// 退出登录时候
watch(
  () => user.isLogin,
  async (val) => {
    if (val) {
      // 获取用户信息
      user.onCheckLogin();
    }
  },
  {
    immediate: true,
  },
);

// https://nuxt.com.cn/docs/guide/directory-structure/app
// 准备完成关闭加载
onMounted(() => {
  const app = document.querySelector("#app");
  if (app)
    app.classList.remove("stop-transition");
  ElMessage.closeAll("error");
  const font = setting.settingPage.fontFamily.value || null;
  if (font)
    document.documentElement.style.setProperty("--font-family", font);
  // 是否关闭动画
  if (setting.settingPage.isColseAllTransition)
    document.documentElement.classList.add("stop-transition-all");
  else
    document.documentElement.classList.remove("stop-transition-all");
});
useHead({
  title: `${appName} - 开启你的极物之旅 ✨`,
  meta: [
    {
      name: "description",
      content: "极物圈-主页 开启你的极物之旅！",
    },
  ],
  htmlAttrs: {
    lang: "zh",
  },
});
useSeoMeta({
  title: `${appName} - 开启你的极物之旅 ✨`,
  description: "极物圈-主页 开启你的极物之旅！",
  keywords: appKeywords,
});


const colorMode = useColorMode();
function keyToggleTheme(e: KeyboardEvent) {
  if (setting.isThemeChangeLoad)
    return;
  if (e?.altKey && e?.key && e?.key === "k") {
    // 计算屏幕中心坐标
    const centerX = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) / 2;
    const centerY = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) / 2;
    useModeToggle(colorMode.preference === "dark" ? "light" : "dark", {
      clientX: +centerX,
      clientY: +centerY,
    } as MouseEvent);
  }
}
setting.isThemeChangeLoad = true;
setting.isThemeChangeLoad = true;
onMounted(() => {
  // 覆盖
  window.addEventListener("keydown", keyToggleTheme);
  if (setting.settingPage.modeToggle.value === "auto") {
    const nowDate = new Date();
    useModeToggle(nowDate.getHours() < 18 && nowDate.getHours() > 6 ? "light" : "dark");
  }
  setTimeout(() => {
    setting.isThemeChangeLoad = false;
  }, 1000);
});
// 同步修改系统 主题
watch(() => setting.settingPage.modeToggle.value, (val) => {
  const nowDate = new Date();
  if (val === "auto")
    useModeToggle(nowDate.getHours() < 18 && nowDate.getHours() > 6 ? "light" : "dark");
}, {
  immediate: false,
});


onUnmounted(() => {
  window.removeEventListener("keydown", keyToggleTheme);
});
</script>

<template>
  <div id="app">
    <NuxtPage />
  </div>
</template>

<style lang="scss">
// .page-enter-active,
// .page-leave-active {
//   opacity: 1;
//   transition-duration: 0.1s;
//   transition-property: opacity;
//   will-change: opacity;
// }

// .page-enter-from,
// .page-leave-to {
//   opacity: 0;
// }

// .dark .page-enter-from,
// .dark .page-leave-to {
//   opacity: 0.7;
// }
</style>
