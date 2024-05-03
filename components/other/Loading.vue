<script lang="ts" setup>
// 加载
const isPageLoading = ref<boolean>(true);
onMounted(() => {
  isPageLoading.value = false;
});
</script>

<template>
  <transition name="fade">
    <div
      v-if="isPageLoading"
      style="position: fixed;top: 0;display: flex; justify-content: center;align-items: center;left: 0;width: 100%;height: 100vh;z-index: 9999;overflow: hidden;"
      text-shadow-color-op-50
      class="bg-light text-shadow text-shadow-color-light dark:(bg-dark text-shadow-color-[#000])"
    >
      <h2
        flex-row-c-c
        animate-pulse
        class="tracking-3"
      >
        <img
          src="/logo.png"
          class="mr-3 h-2rem w-2rem"
        >
        极物圈
      </h2>
    </div>
  </transition>
</template>

<style scoped lang="scss"></style>
