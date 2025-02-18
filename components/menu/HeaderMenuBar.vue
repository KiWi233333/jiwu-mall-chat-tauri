<script lang="ts" setup>
const setting = useSettingStore();
const chat = useChatStore();
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
  chat.isOpenContact = !chat.isOpenContact;
}
</script>

<template>
  <menu
    class="group nav"
  >
    <!-- 菜单栏 -->
    <slot name="left">
      <div class="left relative z-1000 flex-row-c-c gap-3 tracking-0.2em">
        <NuxtLink to="/" class="hidden flex-row-c-c sm:flex">
          <img src="/logo.png" class="h-2rem w-2rem" alt="logo">
        </NuxtLink>
        <strong hidden sm:block>极物聊天</strong>
        <div
          class="btn-primary"
          :class="!chat.isOpenContact ? 'flex-row-c-c animate-zoom-in animate-duration-200 sm:hidden' : 'hidden '" @click="toggleContactOpen"
        >
          <i i-solar-alt-arrow-left-line-duotone p-3 />
        </div>
      </div>
    </slot>
    <!-- 拖拽区域 -->
    <div class="absolute left-0 top-0 z-0 h-full w-full flex-row-c-c" data-tauri-drag-region>
      <slot name="drag-content" />
    </div>
    <slot name="center" />
    <!-- 会话搜索框 -->
    <slot name="search-contact">
      <i
        v-if=" $route.path === '/' && setting.isMobileSize && chat.isOpenContact"
        class="i-solar:magnifer-outline ml-a animate-zoom-in animate-duration-200 btn-primary"
        title="搜索会话"
        @click="toggleContactSearch"
      />
    </slot>
    <!-- 菜单栏右侧 -->
    <slot name="right">
      <div class="right relative z-1 flex items-center gap-1 sm:gap-3">
        <!-- 下载（部分端） -->
        <BtnDownload v-if="!setting.isWeb" icon-class="block mx-1 w-5 h-5" />
        <!-- 折叠菜单 -->
        <MenuDots>
          <template #btn>
            <div
              text
              class="mx-1 w-2em flex-row-c-c sm:w-2.2em btn-primary"
              size="small"
              title="菜单"
            >
              <i class="i-solar:add-circle-linear p-2.8 sm:i-solar:hamburger-menu-outline" />
            </div>
          </template>
        </MenuDots>
        <template v-if="setting.isDesktop || setting.isWeb">
          <!-- web下载推广菜单 -->
          <BtnAppDownload />
          <!-- 菜单按钮 -->
          <template v-if="!['android', 'web', 'ios'].includes(setting.appPlatform)">
            <div class="h-1.2em border-default-l" />
            <MenuController>
              <template #start="{ data }">
                <ElButton
                  text
                  size="small"
                  :style="data.btnStyle"
                  @click="data.handleWindow('alwaysOnTop')"
                >
                  <i
                    :title="data.isAlwaysOnTopVal ? '取消置顶' : '置顶'"
                    class="i-solar:pin-broken cursor-pointer text-0.8em transition-200"
                    :class="data.isAlwaysOnTopVal ? ' mb-1 color-[var(--el-color-warning)] -rotate-45' : 'mb-0 btn-primary'"
                  />
                </ElButton>
              </template>
            </MenuController>
          </template>
        </template>
      </div>
    </slot>
  </menu>
</template>

<style lang="scss" scoped>
.nav {
  --at-apply: "h-56px sm:h-50px relative left-0 top-0 flex-row-bt-c select-none gap-4 rounded-b-0 px-3  border-default-b  bg-color";
  z-index: 999;
  background-size: 3px 3px;
  backdrop-filter: blur(1rem);
}

.dark .nav {
  backdrop-filter: blur(1rem);
  background-size: 3px 3px;
}
@media screen and (max-width: 768px) {
  .menus {

    :deep(.el-button) {
      background-color: transparent !important;
    }
  }
}
</style>
