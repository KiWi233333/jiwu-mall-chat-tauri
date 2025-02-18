<script lang="ts" setup>
const { status } = defineProps<{
  status?: WsStatusEnum
}>();

const statusMap = {
  [WsStatusEnum.CONNECTION]: "连接中",
  [WsStatusEnum.OPEN]: "在线",
  [WsStatusEnum.SAFE_CLOSE]: "离线",
  [WsStatusEnum.CLOSE]: "离线",
};
const statusText = computed(() => status !== undefined ? statusMap[status] : "未知");

const getStatusClass = computed(() => {
  switch (status) {
    case WsStatusEnum.CONNECTION:
      return "bg-gray-500";
    case WsStatusEnum.OPEN:
      return "bg-theme-info";
    case WsStatusEnum.SAFE_CLOSE:
      return "bg-gray-500";
    case WsStatusEnum.CLOSE:
      return "bg-theme-danger";
    default:
      return "bg-gray-500";
  }
});
</script>

<template>
  <div flex items-center>
    <span class="mr-1 h-2.4 w-2.4 rounded-1/2" :class="getStatusClass" />
    {{ statusText }}
  </div>
</template>

<style scoped lang="scss">
</style>
