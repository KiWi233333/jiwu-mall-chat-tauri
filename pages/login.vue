<script lang="ts" setup>
import { appDescription, appKeywords } from "@/constants/index";

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
});
</script>

<template>
  <div
    class="main-box relative overflow-hidden shadow bg-color"
    grid="~ cols-1 md:cols-2"
  >
    <div data-tauri-drag-region absolute right-0 z-1000 w-100vw flex items-center gap-2 sm:w-50vw>
      <div ml-a flex p-2 sm:p-4>
        <BtnAppDownload />
        <MenuController v-if="setting.isDesktop" key="header" :show-max="false" />
      </div>
    </div>
    <!-- bg -->
    <div hidden h-full w-full select-none border-0 border-r-1px shadow-md shadow-inset md:block border-default>
      <ElImage src="/images/login_bg.jpg" fit="cover" class="h-full w-full select-none overflow-hidden rounded-r-0 card-default" />
    </div>
    <!-- 表单 -->
    <div
      class="mt-a h-7/10 flex flex-col select-none rounded-t-8 pt-10 shadow-lg sm:(mt-0 h-full animate-none border-0 rounded-t-0 bg-color pt-24vh shadow-none) border-default-t bg-color-br"
      data-tauri-drag-region
      data-fade
    >
      <div mx-a class="w-4/5 text-center sm:(w-3/5 text-left)">
        <div key="login-bg" class="flex items-center gap-3 sm:(relative left-a top-a)">
          <ElImage
            src="/logo.png" class="h-2em w-2em"
          />
          <h4 class="font-bold tracking-0.2em">
            极物聊天
          </h4>
        </div>
        <div ref="autoAnimateRef" class="relative mt-6 sm:mt-8">
          <!-- 登录 -->
          <FormLoginForm
            v-if="user.showLoginForm"
            key="login-form"
          />
          <!-- 注册 -->
          <FormRegisterForm
            v-else-if="user.showRegisterForm"
            key="register-form"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@media (max-width: 640px) {
  .main-box {
    background-image: url("/images/login_bg.jpg");
    background-repeat: no-repeat;
    background-position: top center;
    background-size: 100% 42%;
  }
}
</style>
