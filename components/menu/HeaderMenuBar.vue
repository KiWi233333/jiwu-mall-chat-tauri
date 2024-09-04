<script lang="ts" setup>
import { type Platform, platform } from "@tauri-apps/api/os";

const user = useUserStore();
const isTop = ref(false);
const setting = useSettingStore();
const appPlatform = ref<Platform | "web">("darwin");

onMounted(async () => {
  try {
    appPlatform.value = await platform();
  }
  catch (error) {
    console.log(error);
    appPlatform.value = "web";
  }
});
// @unocss-include
</script>

<template>
  <!-- 菜单栏 -->
  <menu
    class="group nav sticky left-0 top-0 h-2rem flex-row-bt-c select-none gap-4 border-0 border-b-0 border-b-1px rounded-b-0 px-4 border-default bg-color"
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
    <div class="flex flex-shrink-0 items-center gap-4">
      <div class="flex items-center gap-4 rounded-2rem px-2 py-1 op-40 border-default v-card group-hover-op-100">
        <!-- 主题 -->
        <BtnTheme
          id="toggle-theme-btn"
          class="relativ z-1 btn-primary"
          title="切换主题"
        />
        <!-- 退出登录 -->
        <i
          circle plain
          class="cursor-pointer btn-danger"
          title="退出登录"
          transition="all cubic-bezier(0.61, 0.225, 0.195, 1.3)"
          i-solar:logout-3-broken
          p-2 @click="user.exitLogin()"
        />
      </div>
      <div v-if="appPlatform !== 'web'" class="flex items-center gap-2 border-0 border-l-1px pl-3 border-default">
        <MenuController>
          <template #start="{ data }">
            <ElButton
              text text-amber-1 size="small" style="font-size: 1rem;padding: 0;width: 2.6rem;height: 1.8rem;margin: 0;" @click="() => {
                if (data.onToggleWindow) {
                  isTop = data.onToggleWindow('alwaysOnTop').isAlwaysOnTopVal
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
