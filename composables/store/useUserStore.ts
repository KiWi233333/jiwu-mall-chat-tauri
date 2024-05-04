import { acceptHMRUpdate, defineStore } from "pinia";
import { invoke } from "@tauri-apps/api";
import { type UserInfoVO, type UserWallet, getUserInfo, getUserInfoSSR } from "../api/user/info";
import { toLogout } from "../api/user";
import { getUserWallet } from "../api/user/wallet";
import { useWindow } from "../tauri/window";
import type { CommCategory } from "@/composables/api/community/category";
import type { IndexMenuType } from "~/components/menu";

// @unocss-include
// https://pinia.web3doc.top/ssr/nuxt.html#%E5%AE%89%E8%A3%85
export const useUserStore = defineStore(
  "user",
  () => {
    // token
    const token = ref<string>("");
    // 是否登录
    const isLogin = ref<boolean>(false);
    // 是否打开登录
    const showLoginForm = ref<boolean>(false);
    const showRegisterForm = ref<boolean>(false);
    const showUpdatePwd = ref<boolean>(false);
    // 钱包信息
    const userWallet = ref<UserWallet>({
      userId: "",
      balance: 0,
      recharge: 0,
      spend: 0,
      points: 0,
      updateTime: "",
      createTime: "",
    });
    // 用户个人信息
    const userInfo = ref<UserInfoVO>({
      id: "",
      username: "",
      email: "",
      phone: "",
      nickname: "",
      gender: Gender.BOY,
      avatar: "",
      birthday: "",
      createTime: "",
      slogan: "",
      updateTime: "",
      lastLoginTime: "",
      status: UserStatus.FALESE,
      isEmailVerified: 0,
      isPhoneVerified: 0,
    });
    const getToken = computed({
      get() {
        if (!isLogin.value || !token.value) {
          showLoginForm.value = true;
          return "";
        }
        else {
          return token.value;
        }
      },
      set(value) {
        token.value = value;
      },
    });

    function getTokenFn() {
      return token.value;
    }
    /**
     * 加载用户钱包信息
     * @param token 用户token
     */
    const loadUserWallet = async (token: string): Promise<boolean> => {
      const wallet = await getUserWallet(token);
      if (wallet.code === StatusCode.SUCCESS) {
        userWallet.value = wallet.data as UserWallet;
        return true;
      }
      else {
        return false;
      }
    };

    /**
     * 用户登录
     * @param t t
     */
    const onUserLogin = async (t: string, saveLocal?: boolean) => {
      // 钱包
      loadUserWallet(t);
      const res = await getUserInfo(t);
      if (res.code && res.code === StatusCode.SUCCESS) {
        userInfo.value = res.data as UserInfoVO;
        isLogin.value = true;
        token.value = t;
      }
      else { onUserExit(t); }
    };

    // 退出登录
    function exitLogin() {
      ElMessageBox.confirm("是否确认退出登录？", "退出登录", {
        confirmButtonText: "确认退出",
        confirmButtonClass: "el-button--danger",
        lockScroll: false,
        center: true,
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          // 退出登录
          onUserExit(token.value);
          invoke("window_to_login_page");
          if (document)
            ElMessage.success("退出成功！");
        })
        .catch(() => { });
    }

    /**
     * 加载用户信息
     * @param token 用户token
     */
    const loadUserInfo = async (token: string): Promise<boolean> => {
      const user = await getUserInfo(token);
      if (user.code === StatusCode.SUCCESS) {
        userInfo.value = user.data;
        return true;
      }
      else {
        return false;
      }
    };

    /**
     * 用户确认状态
     */
    const onCheckLogin = () => {
      if (token.value)
        return onUserLogin(token.value);
    };
    /**
     * 退出登录
     * @param t token
     */
    async function onUserExit(t?: string) {
      if (t) {
        clearUserStore();
        return await toLogout(t);
      }
    }
    /**
     * 清空store缓存
     */
    function clearUserStore() {
      token.value = "";
      isLogin.value = false;
      userWallet.value = {
        userId: "",
        balance: 0,
        recharge: 0,
        spend: 0,
        points: 0,
        updateTime: "",
        createTime: "",
      };
      userInfo.value = {
        id: "",
        username: "",
        email: "",
        phone: "",
        nickname: "",
        gender: Gender.BOY,
        avatar: "",
        birthday: "",
        createTime: "",
        updateTime: "",
        slogan: "",
        lastLoginTime: "",
        status: UserStatus.FALESE,
        isEmailVerified: 0,
        isPhoneVerified: 0,
      };
    }
    return {
      // state
      token,
      isLogin,
      showUpdatePwd,
      showLoginForm,
      showRegisterForm,
      userInfo,
      userWallet,
      // actions
      onUserLogin,
      onCheckLogin,
      onUserExit,
      exitLogin,
      clearUserStore,
      loadUserWallet,
      loadUserInfo,
      // getter
      getToken,
      getTokenFn,
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
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot));
