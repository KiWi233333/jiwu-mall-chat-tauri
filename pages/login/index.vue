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
onMounted(() => {
  user.showLoginForm = true;
});
</script>

<template>
  <div
    v-auto-animate
    class="forms flex-row-c-c"
  >
    <!-- 登录 -->
    <FormLoginForm
      v-if="user.showLoginForm"
      key="login-form" class="rounded-6px bg-white shadow-2xl border-default dark:bg-dark-7"
    />
    <!-- 注册 -->
    <FormRegisterForm
      v-else-if="user.showRegisterForm"
      key="register-form" class="rounded-6px bg-white shadow-2xl border-default dark:bg-dark-7"
    />
  </div>
</template>

<style scoped lang="scss">
.forms {
  position: fixed;
  top: 0;
  left: 0;
  background-color: transparent;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.fadeInOutShadow-enter-active {
  animation: 0.2s fadeIn $animate-cubic;
}

.fadeInOutShadow-leave-active {
  animation: 0.2s fadeOut $animate-cubic;
}

.animate__animated {
  animation-duration: 0.2s;
}
</style>
