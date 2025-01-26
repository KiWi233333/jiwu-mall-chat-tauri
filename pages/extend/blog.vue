<script lang="ts" setup>
import { appName } from "@/constants";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";


useSeoMeta({
  title: `博客`,
  description: `分享${appName}的心得与经验`,
});

const setting = useSettingStore();
const isLoading = ref(true);
const shopUrl = computed(() => "https://kiwi233.top/");

onMounted(async () => {
  if (setting.isDesktop) {
    const wind = WebviewWindow.getCurrent();
    await wind.setMinSize(new LogicalSize(375, 780));
    await wind.setSize(new LogicalSize(375, 780));
  }
});
</script>

<template>
  <div
    v-loading="isLoading"
    :element-loading-spinner="defaultLoadingIcon"
    element-loading-background="transparent"
    class="w-full flex flex-col select-none"
  >
    <iframe
      v-if="shopUrl"
      class="select-none"
      :src="shopUrl"
      frameborder="0"
      width="100%"
      height="100%"
      @load="isLoading = false"
      @error="isLoading = false"
    />
  </div>
</template>

<style scoped lang="scss">
.mains {
  --at-apply: 'grid grid-cols-1 pl-2rem pr-4rem sm:(grid-cols-[2fr_1fr] px-4rem)';
}
</style>
