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
    latestVersion.value = res;
    if (ua.toLowerCase().includes("windows"))
      downloadUrl.value = res.platforms["windows-x86_64"].url;
    else if (ua.toLowerCase().includes("macos"))
      downloadUrl.value = res.platforms["darwin-aarch64"].url;
    else if (ua.toLowerCase().includes("linux"))
      downloadUrl.value = res.platforms["linux-x86_64"].url;
    else if (ua.includes("iPhone"))
      downloadUrl.value = `${BaseUrlAppFile}/app/${res.version}/JiwuChat_${res.version}.apk`;
    else
      downloadUrl.value = "https://kiwi233.top/%E9%A1%B9%E7%9B%AE/%E6%9E%81%E7%89%A9%E8%81%8A%E5%A4%A9.html#%F0%9F%92%BB-%E4%B8%8B%E8%BD%BD";
  }
}, { immediate: true });
</script>

<template>
  <el-tooltip v-if="setting.isWeb" content="GitHub仓库" placement="bottom">
    <a
      href="https://github.com/KiWi233333/jiwu-mall-chat-tauri"
      target="_blank"
      class="mr-2 h-2rem w-2rem flex-row-c-c rounded-full border-default card-default"
      v-bind="$attrs"
    >
      <svg height="20" width="20" aria-hidden="true" viewBox="0 0 24 24" version="1.1" data-view-component="true" class="fill-dark dark:fill-light">
        <path d="M12.5.75C6.146.75 1 5.896 1 12.25c0 5.089 3.292 9.387 7.863 10.91.575.101.79-.244.79-.546 0-.273-.014-1.178-.014-2.142-2.889.532-3.636-.704-3.866-1.35-.13-.331-.69-1.352-1.18-1.625-.402-.216-.977-.748-.014-.762.906-.014 1.553.834 1.769 1.179 1.035 1.74 2.688 1.25 3.349.948.1-.747.402-1.25.733-1.538-2.559-.287-5.232-1.279-5.232-5.678 0-1.25.445-2.285 1.178-3.09-.115-.288-.517-1.467.115-3.048 0 0 .963-.302 3.163 1.179.92-.259 1.897-.388 2.875-.388.977 0 1.955.13 2.875.388 2.2-1.495 3.162-1.179 3.162-1.179.633 1.581.23 2.76.115 3.048.733.805 1.179 1.825 1.179 3.09 0 4.413-2.688 5.39-5.247 5.678.417.36.776 1.05.776 2.128 0 1.538-.014 2.774-.014 3.162 0 .302.216.662.79.547C20.709 21.637 24 17.324 24 12.25 24 5.896 18.854.75 12.5.75Z" />
      </svg>
    </a>
  </el-tooltip>
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
