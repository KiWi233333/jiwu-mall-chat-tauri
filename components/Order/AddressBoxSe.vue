<script lang="ts" setup>
import type { AddressInfoVO } from "~/composables/api/user/address";

const { address } = defineProps<{
  address: AddressInfoVO
}>();
</script>

<template>
  <div
    :key="address.id" relative mr-3 mt-2 min-h-160px w-240px flex flex-col cursor-pointer border-2px rounded-6px rounded-8px p-3.4 leading-1.2em opacity-90 transition-300
    border-default
    class="group hover:border-[var(--el-color-primary)] dark:hover:border-[var(--el-color-primary)]"
  >
    <div flex-row-c-c justify-start border-0 border-b-2px pb-2 font-600 border-default-dashed>
      <p>{{ address.name }}</p>
      <el-tag v-if="address.isDefault && address.isDefault === 1" class="ml-a" plain>
        默认地址
      </el-tag>
    </div>
    <small pt-2>{{ address.phone }}</small>
    <div mt-1 opacity-80>
      <small pr-1>{{ address.province }}</small>
      <small pr-1>{{ address.city }}</small>
      <small pr-1>{{ address.county }}</small>
    </div>
    <small class="truncate">{{ address.address }}</small>
    <div class="btns mt-a w-1/1 flex-row-bt-c">
      <slot name="btns" />
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
