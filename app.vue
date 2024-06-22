<script setup lang="ts">
import { listen } from "@tauri-apps/api/event";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/api/notification";
import { open } from "@tauri-apps/api/shell";
import { checkUpdate, installUpdate, onUpdaterEvent } from "@tauri-apps/api/updater";
import { relaunch } from "@tauri-apps/api/process";
import { appWindow } from "@tauri-apps/api/window";
import type { PayloadType } from "./types/tauri";
import { WsMsgBodyType, WsStatusEnum } from "./composables/types/WsType";
import type { ChatMessageVO } from "./composables/api/chat/message";
import { appKeywords, appName } from "@/constants/index";

// 1、确认是否登录
const user = useUserStore();
const setting = useSettingStore();
// https://nuxt.com.cn/docs/guide/directory-structure/app

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
    // 获取
    const dom = document.querySelector("#toggle-theme-btn");
    // 计算屏幕中心坐标
    const centerY = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight);
    const xy = dom?.getBoundingClientRect();
    useModeToggle(colorMode.preference === "dark" ? "light" : "dark", (dom && xy
      ? {
        // 按钮 x y 坐标、
          clientX: xy.x + 10,
          clientY: xy.y + 10,
        }
      : {
          clientX: 40,
          clientY: +centerY - 40,
        }) as MouseEvent);
  }
}
setting.isThemeChangeLoad = true;
setting.isThemeChangeLoad = true;

// 同步修改系统 主题
watch(() => setting.settingPage.modeToggle.value, (val) => {
  const nowDate = new Date();
  if (val === "auto")
    useModeToggle(nowDate.getHours() < 18 && nowDate.getHours() > 6 ? "light" : "dark");
}, {
  immediate: false,
});

onMounted(async () => {
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
});

const timer = ref<any>(null);
onMounted(() => {
  // 准备完成关闭加载bg
  const app = document.body;
  if (app)
    app.classList.remove("stop-transition");
  ElMessage.closeAll("error");
  const font = setting.settingPage.fontFamily.value || null;
  // 设置字体
  if (font)
    document.documentElement.style.setProperty("--font-family", font);
  // 流畅模式
  if (setting.settingPage.isColseAllTransition)
    document.documentElement.classList.add("stop-transition-all");
  else
    document.documentElement.classList.remove("stop-transition-all");

  // 主题切换
  window.addEventListener("keydown", keyToggleTheme);
  if (setting.settingPage.modeToggle.value === "auto") {
    const nowDate = new Date();
    useModeToggle(nowDate.getHours() < 18 && nowDate.getHours() > 6 ? "light" : "dark");
  }
  setTimeout(() => {
    setting.isThemeChangeLoad = false;
  }, 1000);

  // 阻止默认行为，防止右键菜单弹出
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
  // 优化动画性能
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

  // 禁用F5刷新页面
  // window.addEventListener("keydown", (e) => {
  //   if (e.key === "F5")
  //     e.preventDefault(); // 阻止默认行为，防止页面刷新。
  // });

  // Tauri事件
  // 获取版本更新
  setting.appUploader.isUpdatateLoad = false;
  setting.appUploader.isUpload = false;
  setting.appUploader.version = "";
  setting.appUploader.newVersion = "";
  setting.checkUpdates(true);
  // 监听open_url事件
  listen<PayloadType>("open_url", (e) => {
    const url = e.payload.message; // 路径
    if (url)
      open(url);
  });
  // 监听路由事件
  listen<PayloadType>("router", (e) => {
    const path = e.payload.message; // 路径
    if (path)
      navigateTo(path);
  });
});
onUnmounted(() => {
  window.removeEventListener("keydown", keyToggleTheme);
});

// 聊天模块
const ws = useWs();
// 通知消息类型  WsMsgBodyType
const noticeType = [
  WsMsgBodyType.MESSAGE, // 普通消息
  WsMsgBodyType.APPLY, // 好友消息
];
const chat = useChatStore();

// 创建 Web Worker
let worker: Worker;
// 初始化
function reload() {
  worker?.terminate?.();
  worker = new Worker("useWsWoker.js");
  // 初始化 WebSocket 连接
  ws.initDefault((e) => {
    // 将 WebSocket 状态和noticeType发送给 Web Worker 初始化状态
    worker.postMessage({
      status: ws.status,
      noticeType,
    });
    ws.sendHeart();
    ws.onMessage(async (msg) => {
      // 消息通知
      if (noticeType.includes(msg.type)) {
        const body = msg.data as ChatMessageVO;
        const isFocused = await appWindow.isFocused();
        if (isFocused) {
          if (chat.theContact.roomId === body.message.roomId)
            chat.setReadList(chat.theContact.roomId);
        }
        else {
          sendNotification({
            icon: BaseUrlImg + body.fromUser.avatar,
            title: body.fromUser.nickName,
            body: `${body.message.content || "消息通知"}`,
          });
        }
      }
    });
  });
  // Web Worker 消息处理
  worker.addEventListener("message", (e) => {
    if (e.data.type === "reload")
      reload();
    if (e.data.type === "heart")
      ws.sendHeart();
    if (e.data.type === "log")
      console.log(e.data.data);
  });
}
// 自动重连
watchDebounced([() => ws.status, () => user.isLogin], (val: [WsStatusEnum, boolean]) => {
  if (val[0] !== WsStatusEnum.OPEN && val[1])
    reload();
  else if (!val[1])
    ws.webSocketHandler?.close();
}, { debounce: 500, immediate: true });

ws.reload = reload; // 暴露给外部调用，用于刷新Web Worker状态。
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
