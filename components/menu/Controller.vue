<script setup lang="ts">
import { getCurrentWindow } from "@tauri-apps/api/window";
import { platform } from "@tauri-apps/plugin-os";
import { appName } from "~/constants";

const {
  size = "default",
  showMin = true,
  showMax = true,
  showClose = true,
} = defineProps<{
  showMin?: boolean
  showMax?: boolean
  showClose?: boolean
  size?: "small" | "default" | "" | undefined
}>();
const defaultSize = size === "default" || size === "" || size === undefined;
const btnStyle = computed(() => ({
  fontSize: defaultSize ? "1.2rem" : "1rem",
  width: defaultSize ? "2.6rem" : "2rem",
  height: defaultSize ? "1.8rem" : "1.5rem",
  // font-size: 1.2rem;padding: 0;width: 2.6rem;height: 1.8rem;;
  padding: 0,
  margin: 0,
}));
const appWindow = getCurrentWindow();

const isMaximized = ref(false);
const isAlwaysOnTopVal = ref(false);
async function onToggleWindow(type: "min" | "max" | "close" | "alwaysOnTop") {
  if (type === "min") {
    await appWindow.minimize();
  }
  if (type === "max") {
    await appWindow.toggleMaximize();
    const isMax = await appWindow.isMaximized();
    isMaximized.value = isMax;
  };
  if (type === "close") {
    if (appWindow.label === LOGIN_WINDOW_LABEL) {
      ElMessageBox.confirm(`确定要退出${appName}程序吗？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        center: true,
        callback: (action: string) => {
          if (action === "confirm") {
            exitApp();
          }
        },
      });
      return;
    }
    await appWindow.hide();
  }
  if (type === "alwaysOnTop") {
    isAlwaysOnTopVal.value = !isAlwaysOnTopVal.value;
    appWindow.setAlwaysOnTop(isAlwaysOnTopVal.value);
  }
  return {
    isMaximized: isMaximized.value,
    isAlwaysOnTopVal: isAlwaysOnTopVal.value,
  };
}
const data = {
  onToggleWindow,
};
const setting = useSettingStore();
onMounted(async () => {
  if (setting.isWeb)
    return;
  try {
    const info = platform();
    if (["windows", "macos", "linux"].includes(info)) {
      const appWindow = getCurrentWindow();
      appWindow.setAlwaysOnBottom(isAlwaysOnTopVal.value);
      isMaximized.value = await appWindow.isMaximized();
    }
  }
  catch (error) {
    console.log(error);
  }
});
</script>

<template>
  <slot name="start" :data="data" />
  <ElButton
    v-if="showMin"
    text size="small" :style="btnStyle" @click="onToggleWindow('min')"
  >
    <i class="i-carbon:subtract btn-primary" title="最小化" />
  </ElButton>
  <ElButton
    v-if="showMax"
    text
    size="small" style="btnStyle" @click="onToggleWindow('max')"
  >
    <i
      :class="isMaximized ? 'i-tabler:minimize' : 'i-tabler:maximize'"
      :title="isMaximized ? '还原' : '最大化'"
      btn-primary
    />
  </ElButton>
  <ElButton v-if="showClose" text size="small" class="text-amber-1" :style="btnStyle" @click="onToggleWindow('close')">
    <i i-carbon:close btn-danger title="关闭" />
  </ElButton>
  <slot name="end" />
</template>

<style lang="">

</style>
