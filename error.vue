<script lang="ts" setup>
const error = useError();
</script>

<template>
  <div>
    <NuxtLayout name="error">
      <OtherError :msg="error?.message || '500，服务端错误！'" />
    </NuxtLayout>
  </div>
</template>

<style scoped lang="scss"></style>
