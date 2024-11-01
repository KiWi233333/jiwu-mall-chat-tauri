import { relaunch } from "@tauri-apps/plugin-process";
import type { Update } from "@tauri-apps/plugin-updater";
import { check } from "@tauri-apps/plugin-updater";
import type { Action } from "element-plus";
import { acceptHMRUpdate, defineStore } from "pinia";
import { disable as disableAutostart } from "@tauri-apps/plugin-autostart";
import { BaseDirectory } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-shell";
import type { OsType, Platform } from "@tauri-apps/plugin-os";
import { appDataDir } from "@tauri-apps/api/path";
import { open as openDialog } from "@tauri-apps/plugin-dialog";

// @unocss-include
// https://pinia.web3doc.top/ssr/nuxt.html#%E5%AE%89%E8%A3%85
export const useSettingStore = defineStore(
  "setting",
  () => {
    const sysPermission = ref({
      isNotification: false,
      isNotificationSound: true,
    });
    const appUploader = ref({
      isCheckUpdatateLoad: false,
      isUpdating: false,
      isUpload: false,
      version: "",
      newVersion: "",
      contentLength: 0,
      downloaded: 0,
      downloadedText: "",
      ignoreVersion: [] as string[],
    });
    const appPlatform = ref<Platform | "web">("web");
    const osType = ref<OsType | "web">("web");
    const isWeb = computed(() => appPlatform.value === "web");
    // 用户页折叠
    const isUserFold = ref(true);
    const isUserCollapse = ref(true);
    // 主页页折叠
    const isFold = ref(true);
    const isCollapse = ref(true);
    const isMobile = ref(false);
    // ---------------------设置-----------------
    const settingPage = ref({
      // 字体
      fontFamily: {
        value: "Alimama",
        list: [] as { name: string; value: string }[],
      },
      modeToggle: {
        value: "auto",
        list: [
          { name: "自动", value: "auto" },
          { name: "日间", value: "light" },
          { name: "夜间", value: "dark" },
        ],
      },
      isAutoStart: false, // 开机自启
      isCloseAllTransition: false, // 是否关闭所有动画效果，包括页面切换动画和组件动画。
      isEscMin: false, // esc
    });
    const contactBtnPosition = ref({
      x: 0,
      y: 0,
    });
    const isChatFold = ref(false);
    const isThemeChangeLoad = ref(false);
    // --------------------- 聊天设置 -----------------
    const isOpenGroupMember = ref(true); // 是否打开 群聊成员菜单列表
    const isOpenContact = ref(true); // 是否打开会话列表
    const showChatMenu = ref(true);
    const downUpChangeContact = ref(true); // 向上向下切换联系人列表

    // ---------------------- 下载管理 -----------------
    const BaseDirCode = BaseDirectory.AppData;
    const showDownloadPanel = ref(false);
    const fileDownloadMap = ref<Record<string, FileItem>>({});
    const fileDownloadList = computed(() => Object.values(fileDownloadMap.value).sort((a, b) => b.downloadTime - a.downloadTime));
    const appDataDownloadDirUrl = ref("");

    // 下载文件回调
    function fileDownProgressCallback(url: string, currentSize: number = 0, totalSize: number = 0, status: FileStatus = FileStatus.DOWNLOADING) {
      const item = fileDownloadMap.value[url];
      if (!item)
        return;
      item.currentSize = currentSize;
      item.totalSize = totalSize;
      item.status = status;
      if (currentSize >= totalSize)
        item.status = FileStatus.DOWNLOADED;
    }

    // 删除文件
    async function deleteDownloadFile(item: FileItem, checked: boolean = true) {
      const file = fileDownloadMap.value?.[item.url];
      if (!file)
        return;
      if (file.status === FileStatus.NOT_FOUND) {
        delete fileDownloadMap.value[item.url];
        return;
      }
      try {
        // 是否存在
        const isExists = await existsFile(file.localPath);
        if (checked && !isExists) {
          ElMessage.warning("文件已不存在，请手动删除！");
          file.status = FileStatus.NOT_FOUND;
          return;
        }
        await removeFile(item.localPath);
        delete fileDownloadMap.value[item.url];
      }
      catch (error) {
        console.warn(error);
        if (checked)
          ElMessage.warning("文件已打开，请关闭后再尝试删除！");
      }
    }

    // 打开文件
    async function openFileByDefaultApp(item: FileItem) {
      if (!item.mimeType)
        return;
      if (item.status === FileStatus.DOWNLOADING)
        return;
      // 是否存在
      const isExists = await existsFile(item.localPath);
      if (!item.localPath || !isExists) {
        ElMessage.warning("文件已不存在，请手动删除！");
        item.status = FileStatus.NOT_FOUND;
        return;
      }
      try {
        await open(item.localPath);
      }
      catch (error) {
        console.warn(error);
        item.status = FileStatus.ERROR;
        ElMessage.error("打开文件失败！");
      }
    }

    // 确认下载文件
    async function checkDownloadPath() {
      if (!appDataDownloadDirUrl.value) {
        await changeDownloadDir();
        return;
      }
      if (!await existsFile(appDataDownloadDirUrl.value))
        await mkdirFile(appDataDownloadDirUrl.value);
    }

    // 切换下载目录
    async function changeDownloadDir() {
      const path = await openDialog({
        multiple: false,
        directory: true,
      });
      if (!path)
        return;
      if (!await existsFile(path)) {
        ElMessage.error("选择路径不存在，请重新选择！");
        return;
      }
      appDataDownloadDirUrl.value = path;
      ElMessage.success("下载路径已更改！");
    }

    // 打开文件所在文件夹
    async function openFileFolder(item: FileItem) {
      if (!item.localPath) {
        ElMessage.error("文件不存在！");
        item.status = FileStatus.NOT_FOUND;
        return;
      }
      // 去除文件名
      const folderPath = item.localPath.split("\\").slice(0, -1).join("\\");
      try {
        if (!await existsFile(folderPath)) {
          ElMessage.error("文件夹不存在！");
          return;
        }
        await open(folderPath);
      }
      catch (error) {
        console.warn(error);
        ElMessage.error("打开文件夹失败！");
      }
    }
    /**
     * 检查更新
     * @returns 是否更新
     */
    async function checkUpdates(checkLog = false) {
      appUploader.value.isCheckUpdatateLoad = true;
      try {
        const update = (await check()) as Update;
        appUploader.value.isUpload = !!update?.available;
        appUploader.value.isCheckUpdatateLoad = false;
        if (!appUploader.value.isUpload || !update.version) {
          appUploader.value.isCheckUpdatateLoad = false;
          appUploader.value.isUpdating = false;
          appUploader.value.isUpload = false;
          const route = useRoute();
          if (route.path.includes("/setting") && checkLog)
            ElMessage.info("当前版本已是最新版本！");
          return false;
        }
        // 检查是否忽略当前版本
        if (checkLog && appUploader.value.ignoreVersion.includes(update.version))
          return false;
        await ElMessageBox.confirm("检测到新版本，是否更新？", `版本 ${update.version}`, {
          confirmButtonText: "确定",
          cancelButtonText: "忽略此版本",
          center: true,
          callback: async (action: Action) => {
            if (action === "confirm") {
              // ElLoading.service({ fullscreen: true, text: "正在更新，请稍等..." });
              appUploader.value.isUpdating = true;
              update
                .downloadAndInstall((e) => {
                  switch (e.event) {
                    case "Started":
                      console.log(e.data.contentLength);
                      appUploader.value.contentLength = e.data.contentLength || 0;
                      console.log(`开始下载，长度 ${e.data.contentLength} bytes`);
                      break;
                    case "Progress":
                      appUploader.value.downloaded += e.data.chunkLength || 0;
                      appUploader.value.downloadedText = `${((appUploader.value.downloaded || 0) / 1024 / 1024).toFixed(2)}MB / ${((appUploader.value.contentLength || 0) / 1024 / 1024).toFixed(2)}MB`;
                      console.log(`下载中 ${appUploader.value.downloadedText}`);
                      break;
                    case "Finished":
                      console.log("下载完成");
                      appUploader.value.isUpload = false;
                      appUploader.value.isCheckUpdatateLoad = false;
                      appUploader.value.isUpdating = false;
                      appUploader.value.downloaded = 0;
                      appUploader.value.downloadedText = "";
                      appUploader.value.contentLength = 0;
                      appUploader.value.newVersion = "";
                      break;
                  }
                })
                .then(async (val) => {
                  console.log(val);
                  await relaunch();
                })
                .catch((error) => {
                  console.error(error);
                  ElMessage.error("更新失败！请检查网络或稍后再试！");
                })
                .finally(() => {
                  appUploader.value.isCheckUpdatateLoad = false;
                  appUploader.value.isUpload = false;
                  appUploader.value.isCheckUpdatateLoad = false;
                  appUploader.value.isUpdating = false;
                  appUploader.value.downloaded = 0;
                  appUploader.value.downloadedText = "";
                  appUploader.value.contentLength = 0;
                  appUploader.value.newVersion = "";
                });
            }
            else if (action === "cancel") {
              if (!appUploader.value.ignoreVersion.includes(update.version))
                appUploader.value.ignoreVersion.push(update.version);
            }
          },
        });
      }
      catch (error) {
        console.warn(error);
        appUploader.value.isCheckUpdatateLoad = false;
        appUploader.value.isUpdating = false;
        appUploader.value.isUpload = false;
      }
    }

    async function loadSystemFonts() {
      settingPage.value.fontFamily.list = [
        { name: "阿里妈妈方圆体", value: "Alimama" },
        { name: "字玩哥特黑白无常体", value: "ZiWanGeTe" },
        { name: "阿里健康体2.0", value: "AlibabaHealthFont2" },
        { name: "阿里妈妈刀隶体", value: "AlimamaDaoLiTi" },
        { name: "阿里妈妈东方大楷", value: "Alimama_DongFangDaKai" },
      ];
      // @ts-expect-error
      if (window.queryLocalFonts) {
        try {
          // @ts-expect-error
          const availableFonts = await window.queryLocalFonts();
          // 获取前20个可用字体
          const fontsMap = {} as { [key: string]: { name: string; value: string } };
          availableFonts.forEach((font: any) => {
            if (fontsMap[font.family])
              return;
            fontsMap[font.family] = {
              name: font.family,
              value: font.family,
            };
          });
          settingPage.value.fontFamily.list = [...settingPage.value.fontFamily.list, ...Object.values(fontsMap)];
        }
        catch (err) {
          console.error(err);
        }
      }
    }

    async function reset() {
      settingPage.value.fontFamily.value = "Alimama";
      settingPage.value.modeToggle.value = "auto";
      settingPage.value.isCloseAllTransition = false;
      settingPage.value.isEscMin = true;
      isChatFold.value = false;
      isOpenContact.value = true;
      isOpenGroupMember.value = true;
      showChatMenu.value = true;
      isThemeChangeLoad.value = false;
      appUploader.value = {
        isCheckUpdatateLoad: false,
        isUpdating: false,
        isUpload: false,
        version: "",
        newVersion: "",
        contentLength: 0,
        downloaded: 0,
        downloadedText: "",
        ignoreVersion: [] as string[],
      };
      contactBtnPosition.value = { x: 0, y: 0 };
      isMobile.value = false;
      isFold.value = true;
      isCollapse.value = true;
      isUserFold.value = true;
      isUserCollapse.value = true;
      // 下载管理
      showDownloadPanel.value = false;
      sysPermission.value = {
        isNotification: false,
        isNotificationSound: true,
      };
      settingPage.value = {
        // 字体
        fontFamily: {
          value: "Alimama",
          list: [],
        },
        modeToggle: {
          value: "auto",
          list: [
            { name: "自动", value: "auto" },
            { name: "日间", value: "light" },
            { name: "夜间", value: "dark" },
          ],
        },
        isAutoStart: false, // 开机自启
        isCloseAllTransition: false, // 是否关闭所有动画效果，包括页面切换动画和组件动画。
        isEscMin: true, // esc
      };
      loadSystemFonts();
      if (!isWeb.value) {
        appDataDownloadDirUrl.value = `${await appDataDir()}\\downloads`;
        if (appDataDownloadDirUrl.value && !await existsFile(appDataDownloadDirUrl.value))
          await mkdirFile(appDataDownloadDirUrl.value);
      }
      else {
        disableAutostart();
      }
    }
    return {
      isMobile,
      isChatFold,
      // state
      isCollapse,
      isOpenContact,
      isOpenGroupMember,
      isFold,
      isUserCollapse,
      isUserFold,
      sysPermission,
      settingPage,
      isThemeChangeLoad,
      appUploader,
      showChatMenu,
      contactBtnPosition,
      downUpChangeContact,
      showDownloadPanel,
      fileDownloadMap,
      fileDownloadList,
      appPlatform,
      appDataDownloadDirUrl,
      BaseDirCode,
      osType,
      isWeb,
      // actions
      checkUpdates,
      loadSystemFonts,
      reset,
      fileDownProgressCallback,
      openFileByDefaultApp,
      deleteDownloadFile,
      openFileFolder,
      changeDownloadDir,
      checkDownloadPath,
      // getter
    };
  },
  {
    // https://prazdevs.github.io/pinia-plugin-persistedstate/frameworks/nuxt-3.html
    persist: {
      storage: persistedState.localStorage,
    },
  },
);
if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useSettingStore, import.meta.hot));
