<script lang="ts" setup>
defineProps<{
  src: string
  loadClass?: string
  loadRootClass?: string
  errorRootClass?: string
  errorClass?: string
  ctxName?: string
}>();
const setting = useSettingStore();
</script>

<template>
  <el-image
    v-if="src !== `${BaseUrlImg}`"
    :src="src"
    fit="cover"
    hide-on-click-modal
    :close-on-press-escape="!setting.settingPage.isEscMin"
    :draggable="false"
    v-bind="$attrs"
    :ctx-name="ctxName"
  >
    <!-- 占位 -->
    <template #placeholder>
      <div :class="loadClass !== undefined ? loadClass : 'sky-loading h-full w-full'" />
    </template>
    <!-- 错误 -->
    <template #error>
      <div :ctx-name="ctxName" class="h-full w-full flex-row-c-c" :class="errorRootClass">
        <i :ctx-name="ctxName" class="icon i-solar-gallery-remove-bold-duotone op-60" :class="errorClass" />
      </div>
    </template>
  </el-image>
  <template v-else>
    <div :ctx-name="ctxName" class="flex-row-c-c text-mini" :class="$attrs.class">
      <i :ctx-name="ctxName" class="icon i-solar-gallery-add-bold-duotone op-60" :class="errorClass" />
    </div>
  </template>
</template>

<style scoped lang="scss">
.icon {
  --at-apply: "block max-w-4/5 min-h-5 min-w-5"
}
</style>
