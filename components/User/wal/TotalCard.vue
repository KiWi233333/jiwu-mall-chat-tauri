<script lang="ts" setup>
const props = defineProps<{
  data: LineWalletDataType
}>();
export interface LineWalletDataType {
  title: string
  name: string // 圆心的文字
  pre?: string | Element // 数字符号前缀
  amount?: number | ComputedRef
  percentage?: number | ComputedRef
  isInt?: boolean
  isIncreAnimate?: boolean
  lightColor?: string
  class?: string
}
</script>

<template>
  <div
    class="v-card flex-row-bt-c p-6"
    :class="props.data.class"
  >
    <!-- 左边 -->
    <div class="flex flex-col justify-between">
      <!-- 标题 -->
      <small


        mb-3 font-600 opacity-80
      >
        {{ props.data.title }}
      </small>
      <!-- 额度 -->
      <h2 class="w-full truncate text-ellipsis">
        <span>{{ props.data.pre }}</span>
        <span
          v-if="props.data.isIncreAnimate && !props.data.isInt"
          v-incre-up="props.data.amount"
        />
        <span
          v-else-if="props.data.isIncreAnimate && props.data.isInt"
        >{{ props.data.amount }}</span>
        <span v-else>{{ props.data.amount }}</span>
      </h2>
      <slot name="default" />
    </div>
    <!-- 右边 -->
    <div class="right px-2">
      <el-progress
        type="circle"
        :width="76"
        :stroke-width="8"
        :indeterminate="true"
        :striped-flow="true"
        :percentage="+(data?.percentage || 0)"
        :color="props.data.lightColor || 'var(--el-color-primary)'"
      >
        <slot name="circle">
          <h3>
            {{ props.data.name }}
          </h3>
        </slot>
      </el-progress>
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.el-progress-circle__track) {
  stroke: #9b9b9b25 !important;
  backdrop-filter: blur(10px);
}
</style>
