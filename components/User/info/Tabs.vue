<script lang="ts" setup>
withDefaults(defineProps<{
  userId: string
}>(), {
});

const user = useUserStore();
const activeMenu = ref<string>("帖 子");
</script>

<template>
  <el-tabs v-model="activeMenu" class="goods-tabs mt-4 min-h-50vh" tab-position="top">
    <!-- 帖 子 -->
    <el-tab-pane
      lazy
      name="帖 子"
      label="帖 子"
      class="animate__animated mt-2 animate-fade-in animate-duration-300" animate-duration-300
    >
      <!-- <CommPostListSe :dto="{ userId: userId || user.userInfo?.id }" class="grid grid-gap-4" /> -->
    </el-tab-pane>
    <!-- 相 关 -->
    <el-tab-pane
      lazy
      class="animate__animated mt-2 animate-fade-in" animate-duration-300
      name="相 关"
      label="相 关"
    />
  </el-tabs>
</template>

<!-- 样式scss -->
<style scoped lang="scss">
.goods-tabs {
	:deep(.el-tabs__item) {
    padding: 1.4em 1.2em;
		user-select: none;
		font-size: 1em;
		display: flex;
		justify-content: center;
    margin-right: 1em;
	}
}
</style>
