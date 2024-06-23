import { relaunch } from "@tauri-apps/api/process";
import { checkUpdate, installUpdate, onUpdaterEvent } from "@tauri-apps/api/updater";
import type { Action } from "element-plus";
import { acceptHMRUpdate, defineStore } from "pinia";

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
      isUpdatateLoad: false,
      isUpload: false,
      version: "",
      newVersion: "",
      ignoreVersion: [] as string[],
    });

    // 用户页折叠
    const isUserFold = ref(true);
    const isUserCollapse = ref(true);
    // 主页页折叠
    const isFold = ref(true);
    const isCollapse = ref(true);
    // ---------------------设置-----------------
    const settingPage = ref({
      // 字体
      fontFamily: {
        value: "Alimama",
        list: [
          { name: "阿里妈妈方圆体", value: "Alimama" },
          { name: "字玩哥特黑白无常体", value: "ZiWanGeTe" },
          { name: "阿里健康体2.0", value: "AlibabaHealthFont2" },
          { name: "阿里妈妈刀隶体", value: "AlimamaDaoLiTi" },
          { name: "阿里妈妈东方大楷", value: "Alimama_DongFangDaKai" },
        ],
      },
      modeToggle: {
        value: "auto",
        list: [
          { name: "自动", value: "auto" },
          { name: "日间", value: "light" },
          { name: "夜间", value: "dark" },
        ],
      },
      isColseAllTransition: false, // 是否关闭所有动画效果，包括页面切换动画和组件动画。
      isEscMin: true, // esc
    });
    const isChatFold = ref(false);
    const isThemeChangeLoad = ref(false);
    // --------------------- 聊天设置 -----------------
    const isOpenGroupMember = ref(true); // 是否打开 群聊成员菜单列表
    const isOpenContact = ref(true);// 是否打开会话列表
    const showChatMenu = ref(true);

    /**
     * 检查更新
     * @returns 检查师傅更新
     */
    async function checkUpdates(check = false) {
      appUploader.value.isUpdatateLoad = true;
      try {
        const update = await checkUpdate();
        appUploader.value.isUpload = !!update.shouldUpdate;
        appUploader.value.isUpdatateLoad = false;
        if (!update.shouldUpdate) {
          ElMessage.success("当前版本已是最新版本！");
          return false;
        }
        if (!update.manifest?.version)
          return;
        if (appUploader.value.isUpload) {
          // 忽略
          if (check && appUploader.value.ignoreVersion.includes(update.manifest?.version))
            return false;

          ElMessageBox.confirm("检测到新版本，是否更新？", `版本 ${update.manifest?.version}`, {
            confirmButtonText: "确定",
            cancelButtonText: "忽略此版本",
            center: true,
            callback: async (action: Action) => {
              if (action === "confirm") {
                ElLoading.service({ fullscreen: true, text: "正在更新，请稍等..." });
                installUpdate().then(async (val) => {
                  console.log(val);
                  await relaunch();
                }).catch((error) => {
                  console.error(error);
                  ElMessage.error("更新失败！请检查网络或稍后再试！");
                }).finally(() => {
                  appUploader.value.isUpdatateLoad = false;
                  ElLoading.service().close();
                });
                onUpdaterEvent(({ error, status }) => {
                  console.log("Updater event", error, status);
                  appUploader.value.isUpdatateLoad = false;
                }).then((unlisten) => {
                // 如果处理程序超出范围，例如组件被卸载，则需要调用 unisten。
                  unlisten();
                }).catch((error) => {
                  console.error(error);
                  appUploader.value.isUpdatateLoad = false;
                  ElMessage.error("更新失败！请检查网络或稍后再试！");
                }).finally(() => {
                  appUploader.value.isUpdatateLoad = false;
                });
              }
              else if (action === "cancel") {
                if (update?.manifest?.version) {
                  if (!appUploader.value.ignoreVersion.includes(update.manifest?.version))
                    appUploader.value.ignoreVersion.push(update?.manifest?.version);
                }
              }
            },
          });
        }
        else {
          ElMessage.info("当前已是最新版本！");
        }
      }
      catch (error) {
        appUploader.value.isUpdatateLoad = false;
      }
    }
    return {
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
      // actions
      checkUpdates,
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
