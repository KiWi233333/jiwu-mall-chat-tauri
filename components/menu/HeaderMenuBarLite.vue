<script lang="ts" setup>
const isTop = ref(false);
const setting = useSettingStore();
const chat = useChatStore();
const route = useRoute();

// 显示窗口按钮
const showWindBtn = computed(() => !setting.isMobile && !setting.isWeb);

// @unocss-include
// 切换搜索
async function toggleContactSearch() {
  setting.isOpenContactSearch = !setting.isOpenContactSearch;
  if (!setting.isOpenContactSearch)
    return;
  await nextTick();
  const el = document.querySelector("#search-contact") as any;
  if (el)
    el?.focus();
}


// 切换会话列表
async function toggleContactOpen() {
  if (route.path !== "/") {
    await navigateTo("/");
    return;
  }
  chat.isOpenContact = !chat.isOpenContact;
}

// 置顶
async function toggleTop(data: { handleWindow: (type: "close" | "alwaysOnTop" | "min" | "max") => Promise<{ isMaximized: boolean; isAlwaysOnTopVal: boolean; } | undefined> }) {
  if (data.handleWindow) {
    const val = await data.handleWindow("alwaysOnTop");
    if (val) {
      isTop.value = val.isAlwaysOnTopVal;
    }
  }
}
</script>

<template>
  <menu
    class="group nav"
  >
    <slot name="left">
      <div class="left relative z-1000 flex-row-c-c gap-3 px-1 tracking-0.2em">
        <template v-if="!setting.isDesktop && !setting.isMobileSize">
          <NuxtLink to="/" class="flex flex-row-c-c">
            <img src="/logo.png" class="h-2rem w-2rem" alt="logo">
          </NuxtLink>
          <strong hidden sm:block>极物聊天</strong>
        </template>
        <div
          class="btn-primary"
          :class="!chat.isOpenContact ? 'flex-row-c-c animate-zoom-in animate-duration-200 sm:hidden' : 'hidden '" @click="toggleContactOpen"
        >
          <i i-solar-alt-arrow-left-line-duotone p-2.8 />
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
        class="i-solar:magnifer-outline ml-a mr-2 animate-zoom-in animate-duration-200 text-1em btn-primary"
        title="搜索会话"
        @click="toggleContactSearch"
      />
    </slot>
    <!-- 菜单栏右侧 -->
    <slot name="right">
      <div class="menus relative z-1 flex items-center gap-2">
        <MenuController
          :show-max="showWindBtn"
          :show-min="showWindBtn"
          :show-close="showWindBtn"
          :size="setting.isMobileSize ? 'small' : 'default'"
        >
          <template #start="{ data }">
            <template v-if="!setting.isWeb">
              <!-- 下载（部分端） -->
              <BtnElButton
                v-if="!setting.isWeb"
                text
                size="small"
                :style="data.btnStyle"
              >
                <BtnDownload icon-class="!text-1rem" />
              </BtnElButton>
              <div v-if="showWindBtn" h-1.2em border-default-r />
              <BtnElButton
                v-if="showWindBtn"
                text
                :size="data.size"
                :style="data.btnStyle"
                @click="toggleTop(data)"
              >
                <i
                  :title="isTop ? '取消置顶' : '置顶'"
                  class="i-solar:pin-broken cursor-pointer text-0.75em transition-200"
                  :class="isTop ? ' mb-1 color-[var(--el-color-warning)] -rotate-45' : 'mb-0 btn-primary'"
                />
              </BtnElButton>
            </template>
            <MenuDots v-if="setting.isMobileSize" :style="data.btnStyle" style="font-size: 1em;" />
          </template>
        </MenuController>
      </div>
    </slot>
  </menu>
</template>

<style lang="scss" scoped>
.nav {
  --at-apply: "h-50px sm:h-fit relative right-0 top-0  flex-row-bt-c select-none gap-2 rounded-b-0 p-4 sm:(p-1)";
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
