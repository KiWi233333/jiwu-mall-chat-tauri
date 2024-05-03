<script lang="ts" setup>
withDefaults(defineProps<{
  data: ButtonItem
}>(), {

});
interface ButtonItem {
  /** 菜单名称 */
  name: string
  /** 菜单图标 */
  iconClass?: string
  isTeleport?: boolean
  /** 菜单链接 */
  methods?: (e: Event) => any
}
</script>

<template>
  <NuxtLink
    key="home"
    :class="{
      btn: data?.isTeleport,
    }"
    to="/"
    class="h-3rem w-3rem shadow-[var(--el-color-primary)] shadow-md shadow-opacity-40"
    style="background-color: var(--el-color-primary)"
    flex-row-c-c rounded-4em p-1 transition-300
    @click="data?.methods"
  >
    <i
      class="i-solar:home-smile-outline p-2.6 text-light"
      :class="data?.iconClass || ''"
    />
  </NuxtLink>
</template>

<style scoped lang="scss">
.btns {
  position: fixed;
  z-index: 990;
  display: flex;
  transition: $transition-delay;
  justify-content: flex-end;
  align-items: center;
  padding: 1rem;
  grid-gap: 0.5rem;
}

:deep(.el-backtop) {
  position: static;
  font-size: 2em;
  color: #fff;
  background-color: var(--el-color-info);
}

.btn-group {
  position: relative;
  transition: all 0.4s;
  align-items: center;
  grid-gap: 0.5rem;

  .btn {
    transition: 0.2s $animate-cubic-bount;
    --at-apply: "w-3rem  md:mt-0 p-0 z-0 opacity-100 md:op-0 group-hover:(opacity-100 h-0 ovferflow-hidden) h-3rem md:h-0 md:transform-[translateY(100%)_scale3d(0, 0, 0.4)]";
  }

}

.btns:hover .btn-group {
  .btn {
    height: 3rem;
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
