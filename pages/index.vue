
<script lang="ts" setup>
definePageMeta({
  key: route => route.path,
  layout: false,
});
</script>

<template>
  <div>
    <NuxtLayout name="chat">
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style lang="scss" scoped>
</style>
