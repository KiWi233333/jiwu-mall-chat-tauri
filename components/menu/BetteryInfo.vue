<script lang="ts" setup>
import { useBattery } from "@vueuse/core";

const betteryInfo = useBattery(window);
</script>

<template>
  <div>
    <!-- 电池 -->
    <div
      v-if="betteryInfo.isSupported.value"
      key="bettery"
      class="device-card flex items-center"
    >
      <i
        :class="
          betteryInfo.charging.value
            ? 'bg-[var(--el-color-info)] i-carbon:battery-charging'
            : 'opacity-80 i-carbon:battery-full'
        "
        mr-2 p-4
      />
      <div class="flex-1">
        <small> {{ betteryInfo.charging.value ? "正在充电" : "放电中" }}</small>
        <el-progress
          striped
          :duration="10"
          :striped-flow="betteryInfo.charging.value"
          :color="betteryInfo.charging.value ? 'var(--el-color-info)' : 'var(--el-color-warning)'"
          :percentage="betteryInfo.level.value * 100"
        />
      </div>
    </div>
    <div v-else>
      <small text-light> 电池监控暂不支持</small>
    </div>
  </div>
</template>

<style scoped lang="scss">
.device-card {
  --at-apply: "v-card border-default  p-2 px-4";
}
</style>
