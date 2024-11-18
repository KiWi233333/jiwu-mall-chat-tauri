import { LogicalPosition } from "@tauri-apps/api/dpi";
import { listen } from "@tauri-apps/api/event";
import { appDataDir } from "@tauri-apps/api/path";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";
import { type as osType, platform, type } from "@tauri-apps/plugin-os";
import { open } from "@tauri-apps/plugin-shell";
import { StateFlags, restoreStateCurrent, saveWindowState } from "@tauri-apps/plugin-window-state";
import { useFlashTray } from "~/composables/tauri/window";
import type { PayloadType } from "~/types/tauri";

/**
 * Tauri事件
 */
export async function userTauriInit() {
  const setting = useSettingStore();
  try {
    const appPlatform = platform();
    if (!appPlatform)
      return;
    setting.appPlatform = appPlatform;
  }
  catch (error) {
    // console.warn(error);
    setting.appPlatform = "web";
    setting.osType = "web";
    return;
  }
  try {
    const osTypeName = osType();
    if (!osTypeName)
      return;
    setting.osType = osTypeName;
  }
  catch (error) {
    // console.warn(error);
    setting.appPlatform = "web";
    setting.osType = "web";
    return;
  }
  const isMobileSystem = ["android", "ios"].includes(setting.osType);
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

  // 2、获取通知权限
  let permissionGranted = await isPermissionGranted();
  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === "granted";
    setting.sysPermission.isNotification = permissionGranted; // 更新通知权限状态
  }
  else {
    setting.sysPermission.isNotification = permissionGranted; // 更新通知权限状态
  }

  // 3、获取文件路径
  if (!await existsFile(setting.appDataDownloadDirUrl))
    setting.appDataDownloadDirUrl = `${await appDataDir()}\\downloads`;


  // 4、初始化窗口状态
  if (!isMobileSystem) {
    restoreStateCurrent(StateFlags.ALL);
    setting.isMobileSize = window?.innerWidth <= 768; // 判断是否为移动端
    const sotpDebounced = watchDebounced(() => setting.isMobileSize, () => {
      saveWindowState(StateFlags.ALL);
    }, {
      debounce: 1000,
    });

    return () => {
      sotpDebounced();
    };
  }
}

/**
 * 初始化用户信息
 */
export async function useAuthInit() {
  const user = useUserStore();
  // 用于iframe嵌入快速登录
  const route = useRoute();
  const iframeToken = route.query.token;
  if (iframeToken && !user.isLogin) {
    let loading = {} as any;
    loading = ElLoading.service({ fullscreen: true, text: "正在登录，请稍等..." });
    user.onUserLogin(String(iframeToken), true, "/", () => {
      setTimeout(() => {
        loading?.close?.();
      }, 300);
    });
  }
  else {
    // 确认是否登录
    user.onCheckLogin();
  }
}

export const MSG_WEBVIEW_NAME = "msgbox";
export const MSG_WEBVIEW_WIDTH = 240;
export const MSG_WEBVIEW_HEIGHT = 300;

/**
 * 初始化消息通知窗口 (仅限桌面端)
 */
export async function useMsgBoxWebViewInit() {
  let platformName = "web";
  try {
    platformName = platform();
  }
  catch (error) {
    return;
  }
  if (!["windows", "linux", "macos"].includes(platformName))
    return;

  const chat = useChatStore();
  const user = useUserStore();
  const ws = useWs();
  const isNewAllMsg = computed(() => chat.isNewMsg || ws.isNewMsg);

  // 监听消息通知事件
  const channel = new BroadcastChannel("main_channel");
  channel.addEventListener("message", handleChannelMsg);
  // 是否有新消息，控制图标闪烁
  const { start, stop, activeIcon, onlineUrl, offlineUrl } = await useFlashTray();
  watchDebounced(isNewAllMsg, async (newVal, oldVal) => {
    if (newVal)
      start(true);
    else
      stop();
  }, {
    immediate: true,
    debounce: 300,
  });
  watch(() => user.isLogin, (newVal, oldVal) => {
    activeIcon.value = newVal ? onlineUrl : offlineUrl;
  }, {
    immediate: true,
  });


  // 判断是否已存在消息通知窗口
  const webview = await WebviewWindow.getByLabel(MSG_WEBVIEW_NAME);
  if (!webview)
    return;

  // 监听点击事件消息通知事件
  const trayClickUnlisten = await listen("tray_click", async (event) => {
    const win = await WebviewWindow.getByLabel("main");
    if (!win)
      return;

    if (isNewAllMsg.value) {
      // 消费第一个未读消息
      const contact = chat.unReadContactList[0];
      chat.setContact(contact);
      if (contact && chat.theContact.roomId === contact?.roomId)
        chat.setReadList(contact?.roomId);
      await nextTick();
      chat.scrollBottom(false);
    }
    else {
      stop();
    }
  });

  // 鼠标移入托盘
  const trayMouseoverUnlisten = await listen("tray_mouseenter", async (event) => {
    if (!isNewAllMsg.value)
      return;
    const win = await WebviewWindow.getByLabel("msgbox");
    if (!win)
      return;
    const position = event.payload as LogicalPosition;
    const types = type();
    const screenSize = window.screen;
    const taskWidth = screenSize.width - screenSize.availWidth;
    const taskHeight = screenSize.height - screenSize.availHeight;
    if (types === "windows") {
      // 任务栏 上下左右四个位置
      let x = position.x - MSG_WEBVIEW_WIDTH / 2;
      let y = position.y - MSG_WEBVIEW_HEIGHT;
      if (x < 0) {
        x = taskWidth;
        y = position.y - MSG_WEBVIEW_HEIGHT / 2;
      }
      if (y < 0) {
        x = position.x - MSG_WEBVIEW_WIDTH / 2;
        y = taskHeight;
      }
      if (x + MSG_WEBVIEW_WIDTH > screenSize.availWidth) {
        x = screenSize.availWidth - MSG_WEBVIEW_WIDTH;
        y = position.y - MSG_WEBVIEW_HEIGHT / 2;
      }
      if (y + MSG_WEBVIEW_HEIGHT > screenSize.availHeight)
        y = screenSize.availHeight - MSG_WEBVIEW_HEIGHT;
      await win.setPosition(new LogicalPosition(x, y));
    }
    else if (types === "macos") {
      await win.setPosition(new LogicalPosition(position.x - MSG_WEBVIEW_WIDTH / 2, position.y));
    }
    await win.show();
    await win.setFocus();
  });

  return () => {
    stop();
    channel.removeEventListener("message", handleChannelMsg);
    trayMouseoverUnlisten?.();
    trayClickUnlisten?.();
  };
}

/**
 * 处理消息通知事件
 * @param event 事件
 * @returns void
 */
async function handleChannelMsg(event: MessageEvent) {
  const payload = event.data;
  const ws = useWs();
  const user = useUserStore();
  const chat = useChatStore();
  if (!payload)
    return;
  const { type, data } = payload;
  const win = await WebviewWindow?.getByLabel("main");
  if (type === "readContact") { // 读取单个
    chat.setContact(chat.contactMap[data.roomId]);
    if (chat.theContact.roomId === data.roomId)
      chat.setReadList(data.roomId);
    if (win) {
      await navigateTo("/");
      await win?.show();
      await win.isMinimized() && await win.unminimize();
      await win?.setFocus();
      chat.scrollBottom(false);
    }
  }
  else if (type === "readAllContact") { // 读取全部
    await navigateTo("/");
    chat.unReadContactList.forEach((p) => {
      setMsgReadByRoomId(p.roomId, user.getToken).then((res) => {
        if (res.code !== StatusCode.SUCCESS)
          return false;
        p.unreadCount = 0;
        ws.wsMsgList.newMsg = ws.wsMsgList.newMsg.filter(k => k.message.roomId !== p.roomId);
        if (p.roomId === chat.theContact.roomId)
          chat.theContact.unreadCount = 0;
      }).catch(() => {
        console.log("readAllContact error");
      });
      return p;
    });
  }
}
