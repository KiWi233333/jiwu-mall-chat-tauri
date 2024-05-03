<script lang="ts" setup>
const user = useUserStore();
function onToggleWindow(type: "min" | "max" | "close") {
  // @ts-expect-error
  window?.windowToggle.toggle(type);
}
</script>

<template>
  <!-- 菜单栏 -->
  <menu class="nav group sticky left-0 top-0 h-2rem flex-row-bt-c select-none gap-4 border-0 border-b-1px rounded-b-0 px-4 border-default bg-color">
    <NuxtLink to="/" class="left flex-row-c-c gap-3 tracking-0.2em">
      <CardElImage src="./logo.png" class="h-1.6rem w-1.6rem" />
      <strong>极物圈</strong>
    </NuxtLink>
    <!-- 拖拽区域 -->
    <div style="-webkit-app-region: drag;flex: 1;height: 100%;" />
    <div class="flex flex-shrink-0 items-center gap-4">
      <div class="flex items-center gap-4 rounded-2rem px-2 py-1 g-hover-op-40 border-default v-card">
        <!-- 主题 -->
        <BtnTheme class="btn-primary" />
        <!-- 退出登录 -->
        <i
          circle plain
          class="cursor-pointer btn-danger"
          transition="all cubic-bezier(0.61, 0.225, 0.195, 1.3)"
          i-solar:logout-3-broken
          p-2 @click="user.exitLogin()"
        />
      </div>
      <div class="flex items-center gap-3 border-0 border-l-1px pl-3 border-default">
        <el-tooltip
          :show-after="500"
          content="最小化"
          placement="bottom"
        >
          <i i-carbon:subtract p-3 btn-primary @click="onToggleWindow('min')" />
        </el-tooltip>

        <el-tooltip
          :show-after="500"
          content="最大化"
          placement="bottom"
        >
          <i
            i-tabler:maximize
            class="text-0.9rem"
            btn-primary @click="onToggleWindow('max')"
          />
        </el-tooltip>
        <el-tooltip
          :show-after="500"
          content="关闭"
          placement="bottom"
        >
          <i i-carbon:close p-3 btn-primary @click="onToggleWindow('close')" />
        </el-tooltip>
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
