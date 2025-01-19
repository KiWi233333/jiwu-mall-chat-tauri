<script lang="ts" setup>
import { appDescription, appKeywords, appName } from "@/constants/index";

useSeoMeta({
  title: "登录 - 极物聊天",
  description: appDescription,
  keywords: appKeywords,
});
const user = useUserStore();
definePageMeta({
  key: route => route.fullPath,
  layout: "default",
});

const setting = useSettingStore();

const [autoAnimateRef, enable] = useAutoAnimate({});
onMounted(() => {
  user.showLoginForm = true;
  enable(!setting.settingPage.isCloseAllTransition);
  // 初始化自动登录
  if (user.isLogin && !user.isOnLogining) {
    // user.isOnLogining = true;
    // setTimeout(async () => {
    //   if (setting.isDesktop) {
    //     await destroyWindow("login");
    //     await createWindow("msgbox");
    //     createWindow("main");
    //   }
    //   else {
    //     await navigateTo("/", { replace: true });
    //   }
    //   user.isOnLogining = false;
    // }, 1500);
  }
});
</script>

<template>
  <div
    class="main-box relative overflow-hidden shadow bg-color"
    grid="~ cols-1 md:cols-2"
    :class="{
      'img-none is-desktop': setting.isDesktop,
      'show-register': user.showRegisterForm,
    }"
  >
    <div data-tauri-drag-region absolute right-0 z-1000 w-100vw flex cursor-move items-center gap-2 sm:w-50vw>
      <div ml-a flex p-2 sm:p-4>
        <BtnAppDownload />
        <MenuController v-if="setting.isDesktop" key="header" :size="setting.isDesktop ? 'small' : ''" :show-max="false" />
      </div>
    </div>
    <!-- bg -->
    <div
      class="hidden h-full w-full select-none border-0 border-r-1px shadow-md shadow-inset md:block border-default"
    >
      <ElImage
        src="/images/login_bg.jpg" fit="cover"
        class="h-full w-full select-none overflow-hidden rounded-r-0 card-default"
      />
    </div>
    <!-- 表单 -->
    <div
      class="flex flex-row-c-c flex-col select-none rounded-t-8 shadow-lg sm:(mt-0 h-full animate-none border-0 rounded-t-0 bg-color shadow-none) bg-color-br"
      :class="setting.isDesktop ? 'w-full h-full !bg-color !rounded-0 animate-none pt-4' : 'h-fit py-10 min-h-6/10 sm:static absolute bottom-0 left-0 w-full   shadow-lg border-default-t'"
      data-fade
    >
      <div class="mx-a w-85/100 text-center sm:(w-3/5 text-left)">
        <div
          key="login-bg"
          class="login-logo absolute left-6 top-6 mb-4 flex items-center gap-3 sm:(static mb-6)"
        >
          <ElImage src="/logo.png" class="logo h-8 w-8" />
          <h3 class="app-name font-bold tracking-0.2em">
            {{ appName }}
          </h3>
        </div>
        <div
          v-if="setting.isDesktop"
          key="login-bg"
          class="flex items-center gap-3 sm:(relative left-a top-a)"
        />
        <div class="relative">
          <TransitionGroup name="popper-blur">
            <!-- 登录 -->
            <FormLoginForm
              v-if="user.showLoginForm"
              key="login-form"
              class="login-form"
            />
            <!-- 注册 -->
            <FormRegisterForm
              v-else-if="user.showRegisterForm"
              key="register-form"
              :size="setting.isDesktop ? 'default' : 'large'"
            />
          </TransitionGroup>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@media (max-width: 640px) {
  .main-box:not(.img-none) {
    background-image: url("/images/login_bg.jpg");
    background-repeat: no-repeat;
    background-position: top center;
    background-size: contain;
    overflow: hidden;
  }
}
.is-desktop {
  .login-logo {
    --at-apply: 'static mb-4 p-0  flex-row-c-c';
    .logo {
      --at-apply: 'w-7 h-7';
    }
    .app-name {
      --at-apply: 'text-1em';
    }
  }
  .login-form {
    --at-apply: 'pb-6';
  }
}
.show-register {
  .login-logo {
    --at-apply: 'hidden';
    .logo {
      --at-apply: 'w-6 h-6';
    }
    .app-name {
      --at-apply: 'text-1em';
    }
  }
}
</style>
