<script lang="ts" setup>
import type { DeviceIpInfo } from "@/composables/api/user/safe";

const { data } = defineProps<{
  data: DeviceIpInfo
}>();
</script>

<template>
  <div class="flex flex-col border-2px rounded-8px p-4 leading-1.5em border-default-dashed v-card">
    <small class="mb-1 flex-row-bt-c font-600">
      {{ data.country && data.country !== "0" ? data.country : "未知" }}
      {{ data.province && data.province !== "0" ? data.province : "未知" }}
      {{ data.city && data.city !== "0" ? data.city : "未知" }}
      <el-tag
        v-if="data.isLocal"
        type="info"
        size="small"
        plain
      >
        本机
      </el-tag>
    </small>
    <small text-0.7em>IP：{{ data.ip }}</small>
    <small

      text-0.7em opacity-80
    >
      系统：{{ data.operatingSystem }}
    </small>
    <small

      text-0.7em opacity-80
    >
      浏览器：{{ data.browser }}
    </small>
    <small

      text-0.7em opacity-80
    >
      运营商：{{ data.operator }}
    </small>
    <div
      class="btns mt-1 flex-row-bt-c opacity-100 transition-300 group-hover:opacity-100 md:opacity-0"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
