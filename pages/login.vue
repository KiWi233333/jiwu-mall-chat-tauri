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
onMounted(async () => {
  user.showLoginAndRegister = "login";
});
</script>

<template>
  <div
    class="main-box relative overflow-hidden shadow bg-color"
    grid="~ cols-1 md:cols-2"
    :class="{
      'img-none is-desktop': setting.isDesktop,
      'show-register': user.showLoginAndRegister === 'register',
    }"
  >
    <div data-tauri-drag-region absolute right-0 z-1000 w-100vw flex cursor-move items-center gap-2 sm:w-50vw>
      <div class="group ml-a flex flex items-center gap-2 p-2 sm:p-4">
        <BtnTheme
          :class="setting.isDesktop ? 'scale-90 op-50 group-hover:op-100' : ' h-2rem w-2rem rounded-1/2 card-default border-default' "
          title="切换主题"
        />
        <BtnAppDownload />
        <MenuController v-if="setting.isDesktop" key="header" :size="setting.isDesktop ? 'small' : ''" :show-max="false" />
      </div>
    </div>
    <!-- bg -->
    <div
      class="hidden h-full w-full select-none border-0 border-r-1px shadow-md shadow-inset md:block border-default"
    >
      <ElImage
        src="https://quang.kiwi2333.top/user_bg/login_bg.jpg" fit="cover"
        class="h-full w-full select-none overflow-hidden rounded-r-0 card-default"
      />
    </div>
    <!-- 表单 -->
    <div
      class="flex flex-row-c-c flex-col select-none rounded-t-8 shadow-lg sm:(mt-0 h-full animate-none border-0 rounded-t-0 shadow-none) bg-color"
      :class="setting.isDesktop ? 'w-full h-full !rounded-0 animate-none pt-4' : 'h-fit pt-16 pb-10 min-h-7/10 sm:static absolute bottom-0 left-0 w-full   shadow-lg border-default-t'"
      data-fade
    >
      <div class="mx-a w-85/100 text-center sm:(w-3/5 text-left)">
        <div
          v-if="setting.isDesktop"
          key="login-bg"
          class="flex items-center gap-3 sm:(relative left-a top-a)"
        />
        <div data-fades>
          <div
            key="login-bg"
            style="--anima: blur-in;"
            class="login-logo absolute left-6 top-6 mb-4 block flex items-center gap-3 sm:(static mb-6)"
          >
            <ElImage src="/logo.png" class="logo h-8 w-8" />
            <h3 class="app-name text-1.2rem font-bold tracking-0.2em">
              {{ appName }}
            </h3>
          </div>
          <!-- 登录 -->
          <FormLoginForm
            v-if="user.showLoginAndRegister === 'login'"
            key="login-form"
            style="--anima: blur-in;"
            class="login-form mt-a"
          />
          <!-- 注册 -->
          <FormRegisterForm
            v-else-if="user.showLoginAndRegister === 'register'"
            key="register-form"
            style="--anima: blur-in;"
            :size="setting.isDesktop ? 'default' : 'large'"
            class="register-form"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@media (max-width: 640px) {
  .main-box:not(.img-none) {
    background-image: url("https://quang.kiwi2333.top/user_bg/login_bg.jpg");
    background-repeat: no-repeat;
    background-position: top center;
    background-size: contain;
    overflow: hidden;
  }
}
.is-desktop {
  .login-logo {
    --at-apply: ' !static mb-4 p-0  flex-row-c-c';
    .logo {
      --at-apply: 'w-8 h-8';
    }
    .app-name {
      --at-apply: 'text-1.2em';
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
