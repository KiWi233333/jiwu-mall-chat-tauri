<script setup lang="ts">
import { appWindow } from "@tauri-apps/api/window";

withDefaults(defineProps<{
  showMin?: boolean
  showMax?: boolean
  showClose?: boolean
}>(), {
  showMin: true,
  showMax: true,
  showClose: true,
});

const isMaximized = ref(false);
const isAlwaysOnTopVal = ref(false);
function onToggleWindow(type: "min" | "max" | "close" | "alwaysOnTop") {
  if (type === "min")
    appWindow.minimize();
  if (type === "max") {
    isMaximized.value = !isMaximized.value;
    appWindow.toggleMaximize();
  };
  if (type === "close") {
    ElMessageBox.confirm("是否关闭应用？", {
      title: "提示",
      type: "warning",
      confirmButtonText: "关闭",
      confirmButtonClass: "el-button--danger",
      center: true,
      cancelButtonText: "取消",
      lockScroll: false,
      callback: async (action: string) => {
        if (action === "confirm")
          appWindow.close();
      },
    });
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
</script>

<template>
  <slot name="start" :data="data" />
  <ElButton
    v-if="showMin"
    text size="small" style="font-size: 1.4rem;padding: 0;width: 2.6rem;height: 1.8rem;;;margin: 0;" @click="onToggleWindow('min')"
  >
    <i
      i-carbon:subtract btn-primary title="最小化"
    />
  </ElButton>
  <ElButton
    v-if="showMax" text
    size="small" style="font-size: 1rem;padding: 0;width: 2.6rem;height: 1.8rem;;;margin: 0;" @click="onToggleWindow('max')"
  >
    <i
      :class="isMaximized ? 'i-tabler:minimize' : 'i-tabler:maximize'"
      :title="isMaximized ? '还原' : '最大化'"
      btn-primary
    />
  </ElButton>
  <ElButton v-if="showClose" text text-amber-1 size="small" style="font-size: 1.2rem;padding: 0;width: 2.6rem;height: 1.8rem;margin: 0;" @click="onToggleWindow('close')">
    <i i-carbon:close btn-primary title="关闭" />
  </ElButton>
  <slot name="end" />
</template>

<style lang="">

</style>
