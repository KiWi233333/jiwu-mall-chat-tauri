<script lang="ts" setup>
const user = useUserStore();
const isTop = ref(false);
const setting = useSettingStore();
// @unocss-include
async function toggleContactSearch() {
  setting.isOpenContactSearch = !setting.isOpenContactSearch;
  if (!setting.isOpenContactSearch)
    return;
  await nextTick();
  const el = document.querySelector("#search-contact") as any;
  if (el)
    el?.focus();
}

const route = useRoute();
async function toggleContactOpen() {
  if (route.path !== "/") {
    await navigateTo("/");
    return;
  }
  setting.isOpenContact = !setting.isOpenContact;
}

const isPageReload = ref(false);
// const online = useOnline();
// const ws = useWs();
// watch(() => (!ws.webSocketHandler || !online.value), (val) => {
//   if (val) {
//     isPageReload.value = true;
//   }
// }, { immediate: true });
function reloadPage() {
  isPageReload.value = true;
  location.reload();
  setTimeout(() => {
    isPageReload.value = false;
  }, 500);
}
</script>

<template>
  <!-- 菜单栏 -->
  <menu
    class="group nav"
  >
    <div class="left relative z-1000 flex-row-c-c gap-3 tracking-0.2em">
      <NuxtLink to="/" class="hidden flex-row-c-c sm:flex">
        <CardElImage src="/logo.png" class="h-1.8rem w-1.8rem" />
      </NuxtLink>
      <div
        class="btn-primary"
        :class="!setting.isOpenContact ? 'flex-row-c-c animate-zoom-in animate-duration-200 sm:hidden' : 'hidden '" @click="toggleContactOpen"
      >
        <i i-solar-alt-arrow-left-line-duotone p-3 />
      </div>
      <strong hidden sm:block>极物圈</strong>
    </div>
    <!-- 拖拽区域 -->
    <div class="absolute left-0 top-0 z-0 h-full w-full flex-row-c-c" data-tauri-drag-region>
      <slot name="drag-content" />
    </div>
    <!-- 会话搜索框 -->
    <i
      v-if=" $route.path === '/' && setting.isMobileSize && setting.isOpenContact"
      class="i-solar:magnifer-outline ml-a animate-zoom-in animate-duration-200 btn-primary"
      title="搜索会话"
      @click="toggleContactSearch"
    />
    <div class="relative z-1000 flex flex-shrink-0 items-center gap-0 sm:gap-2">
      <BtnAppDownload />
      <div class="flex items-center gap-3 rounded-2rem px-2 py-1 border-default card-default">
        <!-- 刷新页面 -->
        <div
          v-show="!isPageReload"
          class="i-solar:refresh-outline h-4.5 w-4.5 cursor-pointer bg-[var(--el-color-info)] transition-300 hover:rotate-180"
          @click="reloadPage"
        />
        <!-- 下载（部分端） -->
        <BtnDownload v-if="setting.appPlatform !== 'web'" class="flex items-center gap-2 border-0 border-l-1px pl-3 border-default" />
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
      <!-- 关闭按钮 -->
      <div v-if="!['android', 'web', 'ios'].includes(setting.appPlatform)" class="ml-2 max-w-9em flex items-center gap-0 border-0 border-l-1px pl-3 sm:(max-w-fit gap-2) border-default">
        <MenuController>
          <template #start="{ data }">
            <ElButton
              text
              size="small"
              style="font-size: 1rem;padding: 0;width: 2.6rem;height: 1.8rem;margin: 0;" @click="async () => {
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
  --at-apply: "h-56px sm:h-50px relative left-0 top-0 flex-row-bt-c select-none gap-4 border-0 border-b-0 border-b-1px rounded-b-0 px-3  border-default-b  bg-color";
  z-index: 999;
  background-size: 3px 3px;
  backdrop-filter: blur(1rem);
}

.dark .nav {
  backdrop-filter: blur(1rem);
  background-size: 3px 3px;
}
</style>
