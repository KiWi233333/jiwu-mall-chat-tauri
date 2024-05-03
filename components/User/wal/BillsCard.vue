<script lang="ts" setup>
import type { BillsInfoVO } from "@/composables/api/user/bills";
import { BillsType, CurrencyType } from "@/composables/api/user/bills";

const { data } = defineProps<{
  data: BillsInfoVO
}>();

const getTypeIcon = computed(() => {
  let className = "i-solar:wallet-bold-duotone bg-red-6";
  switch (data.currencyType) {
    case CurrencyType.BALANCE:
      className = "i-solar:wallet-bold-duotone bg-red-6";
      break;
    case CurrencyType.POINT:
      className = "i-solar:dollar-minimalistic-bold-duotone bg-amber";
      break;
  }
  return className;
});
</script>

<template>
  <div class="bills-card border-0 px-2 pt-6 border-default">
    <div class="flex-row-bt-c rounded-6px">
      <i :class="getTypeIcon" mr-4 p-4.2 />
      <div class="flex flex-1 flex-col justify-between">
        <strong
          mb-2
          :class="data.type === BillsType.IN ? 'text-green-500' : 'text-red-500'"
        >
          {{ data.title }}
        </strong>
        <small>{{ data.createTime }}</small>
      </div>
      <small :class="data.type === BillsType.OUT ? 'text-red-6' : 'text-green-5'">
        {{
          (data.type === BillsType.OUT ? "-" : "+")
            + (data.currencyType === CurrencyType.BALANCE
              ? `￥${data.amount}`
              : `${data.amount}积分`)
        }}</small>
    </div>
    <el-divider style="margin: 0; margin-top: 0.8rem" />
  </div>
</template>

<style scoped lang="scss"></style>
