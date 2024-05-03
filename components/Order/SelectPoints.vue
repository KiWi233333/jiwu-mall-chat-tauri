<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    modelValue: number
    getPointMax: number
    getFinalPrice: any
  }>(),
  {
    modelValue: 0,
  },
);
const emit = defineEmits(["update:modelValue"]);
const model = computed({
  get() {
    return props.modelValue;
  },
  set(val: number) {
    emit("update:modelValue", val);
  },
});
const user = useUserStore();
const order = useOrderStore();
// 滚轮积分
function onWheelPoints(e: WheelEvent) {
  if (order.status !== OrdersStatus.READY && order.status !== OrdersStatus.UN_PAID)
    return;
  if (e.deltaY < 0) {
    // 增加
    if (props.modelValue < 10000 && props.getFinalPrice.intValue > 0)
      emit("update:modelValue", props.modelValue + 100);
  }
  else {
    // 减少
    if (props.modelValue >= 100)
      emit("update:modelValue", props.modelValue - 100);
  }
}
</script>

<template>
  <div flex items-end>
    <!-- 积分优惠 -->
    <small class="relative flex flex-col">
      <div
        v-show="props.modelValue > 0"
        class="absolute bottom-1em right-0 mb-1 ml-a flex-row-c-c text-[var(--el-color-error)]"
      >
        -
        <span block>{{ props.modelValue }}</span>
      </div>
      <div flex items-end justify-end>
        积分剩余：
        <div class="flex flex-col">
          <div>{{ user.userWallet.points }}</div>
        </div>
      </div>
    </small>
    <el-input-number
      v-model.lazy="model"
      style="width: 6em"
      class="ml-4 cursor-ns-resize transition-300"
      :class="{ 'opacity-60': props.modelValue === 0 }"
      :disabled="order.status !== OrdersStatus.READY && order.status !== OrdersStatus.UN_PAID"
      :step="100"
      :step-strictly="true"
      controls-position="right"
      label="只能以100为倍数"
      :min="0"
      :max="props.getPointMax"
      @wheel="onWheelPoints($event)"
    />
  </div>
</template>

