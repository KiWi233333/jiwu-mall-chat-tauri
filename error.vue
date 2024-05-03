<script lang="ts" setup>
// 定义页面元数据
definePageMeta({
  key: route => route.path,
  layout: false,
});

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
