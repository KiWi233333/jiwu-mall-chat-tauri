<script setup lang="ts">
import { listen } from "@tauri-apps/api/event";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/api/notification";
import type { PayloadType } from "./types/tauri";
import { appKeywords, appName } from "@/constants/index";

// 1、确认是否登录
const user = useUserStore();
const setting = useSettingStore();
// https://nuxt.com.cn/docs/guide/directory-structure/app
// 准备完成关闭加载
onMounted(() => {
  const app = document.body;
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
onMounted(() => {
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();// 阻止默认行为，防止右键菜单弹出
  });
});

const timer = ref<any>(null);
onMounted(async () => {
  window.addEventListener("resize", () => {
    if (timer.value)
      clearTimeout(timer.value);// 清除之前的定时器，避免重复触发
    const app = document.documentElement;
    if (app)
      app.classList.add("stop-transition");
    timer.value = setTimeout(() => {
      const app = document.documentElement;
      if (app)
        app.classList.remove("stop-transition");
    }, 600);
  });

  // 获取通知权限
  let permissionGranted = await isPermissionGranted();
  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === "granted";
    setting.sysPermission.isNotification = permissionGranted; // 更新通知权限状态
  }
  else {
    setting.sysPermission.isNotification = permissionGranted; // 更新通知权限状态
  }

  // 监听路由事件
  listen<PayloadType>("router", (e) => {
    const path = e.payload.message; // 路径
    if (path)
      navigateTo(path);
  });
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
//   transition-duration: 0.2s;
//   transition-property: filter;
// }

// .page-enter-from,
// .page-leave-to {
//   filter: blur(6px);
// }

// .dark .page-enter-from,
// .dark .page-leave-to {
//   filter: blur(6px);
// }
</style>
