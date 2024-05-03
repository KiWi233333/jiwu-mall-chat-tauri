<script lang="ts" setup>
const { address } = defineProps<{
  address: {
    name: string
    phone: string
    address: string
    city: string
    county: string
    postalCode: string
    province: string
  }
}>();
</script>

<template>
  <div class="flex flex-col text-1.1rem">
    <div class="flex flex-wrap items-center px-2 leading-1.6em">
      <i
        class="i-solar:map-point-bold-duotone mx-3 bg-[var(--el-color-danger-light-3)] p-5"
      />
      <div class="flex flex-col p-3">
        <strong>
          {{ address.name }}
          <small font-500 opacity-80>{{ address.phone }}</small>
        </strong>
        <small>
          {{ address.province }} {{ address.city }}
          {{ address.county }}
        </small>
        <small text-0.8em>
          {{ address.address }}
          {{ address.postalCode }}
        </small>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
