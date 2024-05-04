<script lang="ts" setup>
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
    v-if="user.showLoginForm || user.showRegisterForm"
    relative h-100vh w-100vw flex-row-c-c overflow-visible shadow border-default card-default bg-color
  >
    <div data-tauri-drag-region class="fixed left-0 top-0 w-full flex items-center justify-between gap-3 p-4">
      <div class="left flex-row-c-c gap-3 tracking-0.2em">
        <CardElImage src="/logo.png" class="h-1.6rem w-1.6rem" />
        <strong>极物圈 | 登录</strong>
      </div>
      <div flex items-center gap-2>
        <MenuController key="header" :show-max="false" />
      </div>
    </div>
    <div class="select-none">
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
  --at-apply: "border-default relative mx-a w-420px rounded-6px card-default"
}
</style>
