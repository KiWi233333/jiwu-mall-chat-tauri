<script lang="ts" setup>
// @unocss-include
defineProps<{
  iconClass?: string
  transitionIcon?: boolean
}>();
</script>

<template>
  <el-button
    v-bind="$attrs"
    class="group-btn"
  >
    <span
      v-if="iconClass"
      class="block h-1.1em"
      :class="[iconClass, transitionIcon ? 'toggle' : 'w-1.1em']"
    />
    <slot name="default" />
  </el-button>
</template>

<style lang="scss" scoped>
.toggle {
  width: 0;
  margin-right: 0;
  transform: scale(0);
  transition-property: all;
  transition-duration: 200ms;
}
.group-btn:hover {
  .toggle {
    width: 1.1em;
    margin-right: 0.4em;
    transform: scale(1);
  }
}
</style>
