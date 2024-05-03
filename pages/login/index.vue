<script lang="ts" setup>
import { invoke } from "@tauri-apps/api";
import { appKeywords } from "@/constants/index";

useSeoMeta({
  title: "极物圈登录",
  description: "极物 - 聊天 - 极物圈 开启你的极物之旅！",
  keywords: appKeywords,
});
const user = useUserStore();
definePageMeta({
  key: route => route.fullPath,
  layout: false,
});
</script>

<template>
  <div
    v-if="user.showLoginForm || user.showRegisterForm" relative h-full w-full
    overflow-visible
  >
    <div class="form absolute left-0 top-0 select-none">
      <div data-tauri-drag-region flex items-center justify-end gap-3 px-4 pt-4>
        <MenuController key="header" :show-max="false" />
      </div>
      <Transition
        name="popup"
        mode="in-out"
      >
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
      </Transition>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form {
  --at-apply: "relative mx-a w-420px rounded-6px bg-white shadow-lg  dark:bg-dark-7"
}
</style>
