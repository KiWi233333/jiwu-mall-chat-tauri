import { acceptHMRUpdate, defineStore } from "pinia";
import type { CommCategory } from "@/composables/api/community/category";
import type { IndexMenuType } from "~/components/menu";

// @unocss-include
// https://pinia.web3doc.top/ssr/nuxt.html#%E5%AE%89%E8%A3%85
export const useSettingStore = defineStore(
  "setting",
  () => {
    // 用户页折叠
    const isUserFold = ref(true);
    const isUserCollapse = ref(true);
    // 主页页折叠
    const isFold = ref(true);
    const isCollapse = ref(true);
    const menuList = ref<IndexMenuType[]>([
      { url: "/", icon: "i-solar:home-2-bold", title: "首页", children: [] },
      { url: "/community/post/list", icon: "i-solar:ufo-3-bold-duotone", title: "极物圈", children: [] },
      {
        url: "/category",
        icon: "i-solar:widget-5-bold-duotone",
        title: "圈子",
        disabled: true,
        children: [],
      },
      { url: "/chat", icon: "i-solar:chat-round-bold-duotone", title: "聊天", children: [] },
      { url: "/setting", icon: "i-solar:settings-linear", title: "设置", children: [] },
    ]);

    // 路由
    async function loadMenus() {
      const { data } = await getCommCategory();
      menuList.value[2].children = data.value?.data?.map(p => toMenuTypeFn(p)) || [];
    }

    // 路由
    function toMenuTypeFn(p: CommCategory): IndexMenuType {
      const arr: IndexMenuType = {
        url: `/community/category/${p.id}`,
        icon: "",
        image: p.image,
        title: p.name,
        children: [],
      };
      if (p.children?.length)
        arr.children = p.children?.map(item => toMenuTypeFn(item)) as IndexMenuType[];
      return arr;
    }


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
    });
    const isChatFold = ref(false);
    const isThemeChangeLoad = ref(false);
    // --------------------- 聊天设置 -----------------
    const isOpenGroupMember = ref(true); // 是否打开 群聊成员菜单列表
    const isOpenContact = ref(true);// 是否打开会话列表
    const showChatMenu = ref(true);

    return {
      isChatFold,
      // state
      isCollapse,
      menuList,
      isOpenContact,
      isOpenGroupMember,
      isFold,
      isUserCollapse,
      isUserFold,
      settingPage,
      isThemeChangeLoad,
      showChatMenu,
      // actions
      loadMenus,
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
