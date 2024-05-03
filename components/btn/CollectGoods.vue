<script lang="ts" setup>
import { getGoodsIsCollect, toggleGoodsCollectStatus } from "~/composables/api/goods/collect";

const props = defineProps<{
  gid?: string
}>();
const user = useUserStore();

// 查询是否收藏
const isCollect = ref<boolean>(false);
if (user.getTokenFn()) {
  if (props.gid) {
    const { data } = await getGoodsIsCollect(props.gid, user.getTokenFn());
    isCollect.value = Boolean(data);
  }
}
// 收藏
async function onCollectGoods() {
  if (!props.gid)
    return;
  const { code, message } = await toggleGoodsCollectStatus(props.gid, user.getToken);
  if (code === StatusCode.SUCCESS) {
    ElMessage.success(`${isCollect.value ? "取消" : "添加"}收藏成功`);
    isCollect.value = !isCollect.value;
  }
  else {
    ElMessage.error(message);
  }
}
</script>

<template>
  <el-popconfirm
    style="text-align: center"
    confirm-button-type="danger"
    confirm-button-text="确认"
    cancel-button-text="取消"
    :title="isCollect ? '是否取消收藏?' : '是否添加收藏?'"
    @confirm="onCollectGoods"
  >
    <template #reference>
      <!-- 收藏 -->
      <div v-auth cursor-pointer>
        <span
          :class="isCollect ? 'i-solar:stars-minimalistic-bold-duotone bg-yellow-5' : 'i-solar:stars-minimalistic-broken'"
          animate-zoom-in p-3 transition-200
        />
      </div>
    </template>
  </el-popconfirm>
</template>

<style scoped lang="scss"></style>
