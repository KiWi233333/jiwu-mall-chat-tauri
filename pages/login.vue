<script lang="ts" setup>
import { appKeywords } from "@/constants/index";

useSeoMeta({
  title: "登录 - 极物聊天",
  description: "极物 - 聊天 - 极物圈 开启你的极物之旅！",
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
    class="relative overflow-hidden overflow-hidden shadow border-default card-default bg-color"
    grid="~ cols-1 md:cols-2"
  >
    <div data-tauri-drag-region fixed right-4 top-4 flex items-center gap-2>
      <MenuController v-if="setting.isDesktop" key="header" :show-max="false" />
    </div>
    <!-- bg -->
    <div hidden h-full w-full select-none border-0 border-r-1px shadow-md shadow-inset md:block border-default>
      <ElImage src="/images/login_bg.jpg" fit="cover" class="h-full select-none overflow-hidden rounded-r-0 card-default" />
    </div>
    <!-- 表单 -->
    <div class="flex flex-col select-none pt-20vh" data-tauri-drag-region>
      <div mx-a class="w-3/4 text-center sm:(w-3/5 text-left)">
        <div key="login-bg" class="fixed left-4 top-0 flex items-center gap-2 py-4 sm:(relative left-a top-a)">
          <ElImage
            src="/logo.png" class="h-2em w-2em"
          />
          <strong class="font-bold tracking-0.2em op-80">
            极物聊天
          </strong>
        </div>
        <div ref="autoAnimateRef">
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
