<script lang="ts" setup>
</script>

<template>
  <el-popover
    width="fit-content"
    popper-class="!border-default"
    popper-style="padding:0;min-width: 0;"
    transition="popper-fade"
    :teleported="true"
    append-to-body
    v-bind="$attrs"
  >
    <template #reference>
      <slot name="reference" />
    </template>
    <slot name="default" />
  </el-popover>
</template>

<style lang="scss" scoped>
</style>
