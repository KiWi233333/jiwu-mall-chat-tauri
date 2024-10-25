<script lang="ts" setup>
const user = useUserStore();
const isTop = ref(false);
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
// @unocss-include
</script>

<template>
  <!-- 菜单栏 -->
  <menu
    class="group nav relative left-0 top-0 h-2rem flex-row-bt-c select-none gap-4 border-0 border-b-0 border-b-1px rounded-b-0 px-4 border-default bg-color"
  >
    <div class="left relative z-1000 flex-row-c-c gap-3 tracking-0.2em">
      <CardElImage
        src="/logo.png" class="h-1.8rem w-1.8rem" @click="() => {
          setting.isOpenContact = !setting.isOpenContact
        }"
      />
      <strong hidden sm:block>极物圈</strong>
    </div>
    <!-- 拖拽区域 -->
    <div class="absolute left-0 top-0 z-0 h-full w-full flex-row-c-c" data-tauri-drag-region>
      <slot name="drag-content" />
    </div>
    <div class="relative z-1000 flex flex-shrink-0 items-center gap-4">
      <el-tooltip v-if="setting.isWeb" :content="`v ${latestVersion?.version}`" placement="bottom">
        <a
          :href="downloadUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="block rounded-2rem py-1.5 pl-4 pr-6 text-xs btn-info-bg border-default card-default"
        >
          <i class="i-solar-download-minimalistic-broken mr-2 p-2" />
          APP
        </a>
      </el-tooltip>
      <div class="flex items-center gap-3 rounded-2rem px-3 py-1 border-default card-default">
        <!-- 下载（部分端） -->
        <BtnDownload v-if="!['android', 'web', 'ios'].includes(setting.appPlatform)" class="flex items-center gap-2 border-0 border-l-1px pl-3 border-default" />
        <!-- 主题 -->
        <BtnTheme
          id="toggle-theme-btn"
          class="relative z-1 btn-primary"
          title="切换主题"
        />
        <!-- 退出登录 -->
        <i
          class="cursor-pointer btn-danger"
          title="退出登录"
          transition="all cubic-bezier(0.61, 0.225, 0.195, 1.3)"
          circle plain i-solar:logout-3-broken p-2 @click="user.exitLogin()"
        />
      </div>
      <div v-if="!['android', 'web', 'ios'].includes(setting.appPlatform)" class="flex items-center gap-2 border-0 border-l-1px pl-3 border-default">
        <MenuController>
          <template #start="{ data }">
            <ElButton
              text text-amber-1 size="small" style="font-size: 1rem;padding: 0;width: 2.6rem;height: 1.8rem;margin: 0;" @click="async () => {
                if (data.onToggleWindow) {
                  const val = await data.onToggleWindow('alwaysOnTop')
                  isTop = val.isAlwaysOnTopVal
                }
              }"
            >
              <i
                :title="isTop ? '取消置顶' : '置顶'"
                i-solar:pin-broken cursor-pointer
                transition-200
                :class="isTop ? ' mb-1 color-[var(--el-color-warning)] -rotate-45' : 'mb-0 btn-primary'"
              />
            </ElButton>
          </template>
        </MenuController>
      </div>
    </div>
  </menu>
</template>

<style lang="scss" scoped>
.nav {
  z-index: 999;
  height: $top-nav-height;
  background-size: 3px 3px;
  backdrop-filter: blur(1rem);
}

.dark .nav {
  backdrop-filter: blur(1rem);
  background-size: 3px 3px;
}
</style>
