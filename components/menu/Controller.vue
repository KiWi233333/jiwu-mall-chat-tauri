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
  <i
    v-if="showMin"
    i-carbon:subtract p-3 btn-primary title="最小化"
    @click="onToggleWindow('min')"
  />
  <i
    v-if="showMax"
    :class="isMaximized ? 'i-tabler:minimize' : 'i-tabler:maximize'"
    :title="isMaximized ? '还原' : '最大化'"
    class="text-0.9rem"
    btn-primary @click="onToggleWindow('max')"
  />
  <i v-if="showClose" i-carbon:close btn-primary title="关闭" @click="onToggleWindow('close')" />
  <slot name="end" />
</template>

<style lang="">

</style>
