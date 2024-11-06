<script lang="ts" setup>
const setting = useSettingStore();
const downloadUrl = ref();
const latestVersion = ref<AppPlatformsJSON>();
watch(() => setting.isWeb, async (isWeb) => {
  if (!isWeb)
    return;
  const res = await getLatestVersion();
  if (res) {
    const ua = navigator.userAgent;
    let system: keyof AppPlatforms = "windows-x86_64";
    if (ua.toLowerCase().includes("windows"))
      system = "windows-x86_64";
    else if (ua.toLowerCase().includes("macos"))
      system = "darwin-aarch64";
    else if (ua.toLowerCase().includes("linux"))
      system = "linux-x86_64";
    latestVersion.value = res;
    downloadUrl.value = res.platforms[system].url || "https://kiwi233.top/%E9%A1%B9%E7%9B%AE/%E6%9E%81%E7%89%A9%E8%81%8A%E5%A4%A9.html#%F0%9F%92%BB-%E4%B8%8B%E8%BD%BD";
  }
}, { immediate: true });
</script>

<template>
  <el-tooltip v-if="setting.isWeb" :content="`v ${latestVersion?.version}`" placement="bottom">
    <a
      :href="downloadUrl"
      target="_blank"
      rel="noopener noreferrer"
      v-bind="$attrs"
      class="block rounded-2rem py-1.5 pl-4 pr-6 text-xs btn-info-bg border-default card-default"
    >
      <i class="i-solar-download-minimalistic-broken mr-2 p-2" />
      APP
    </a>
  </el-tooltip>
</template>

<style scoped lang="scss"></style>
