<script lang="ts" setup>
import { useStorage } from "@vueuse/core";
import type { OrderCommentDTO, OrdersItemVO } from "@/composables/api/orders";

// props
const { orderItem, index, isDisable } = defineProps<{
  orderItem: OrdersItemVO
  isDisable: boolean
  index: number
}>();
const uploadFilesRef = ref({
  images: [],
  video: "",
});
// 评论对象
const dto = useStorage(
  `jiwu_order_comment_${orderItem.id}`,
  reactive<OrderCommentDTO>({
    orderItemId: orderItem.id,
    skuId: orderItem.skuId,
    content: "",
    rate: 0,
    images: [],
    video: "",
    isRecommend: 0,
    isAnonymous: 0,
  }),
  sessionStorage,
);
// 上传内容 控制
watch(
  [() => uploadFilesRef.value.images, () => uploadFilesRef.value.video],
  (val) => {
    if (val[0]) {
      // 图片
      dto.value.images = val[0];
    }
    if (val[1]) {
      // 视频
      dto.value.video = val[1];
    }
  },
  { deep: true },
);
async function clearData() {
  uploadFilesRef.value.images = [];
  uploadFilesRef.value.video = "";
  dto.value = {
    orderItemId: orderItem.id,
    skuId: orderItem.skuId,
    content: "",
    rate: 0,
    images: [],
    video: "",
    isRecommend: 0,
    isAnonymous: 0,
  };
}
defineExpose({ dto, clearData });
</script>

<template>
  <div class="card">
    <!-- 评价内容 -->
    <el-input
      v-model.lazy="dto.content"
      class="mb-4 rounded-10px shadow"
      :disabled="isDisable"
      type="textarea"
      :rows="6"
      :show-word-limit="true"
      :max-length="250"
      size="large"
      placeholder="写下你对商品的真实评价！"
    />
    <div class="flex">
      <OrderCommUpload
        ref="uploadFilesRef"
        :is-disable="isDisable"
      />
    </div>
    <!-- 商品 -->
    <OrderCommGoods
      :order-item="orderItem"
      class="mt-4"
    />
    <!-- 评分 -->
    <div
      mt-4
      flex-row-bt-c
    >
      <div class="flex items-center">
        <small opacity-80>评分：</small>
        <el-rate
          v-model.lazy="dto.rate"
          :disabled="isDisable"
          allow-half
          show-text
          :colors="[
            'var(--el-color-black-light-5)',
            'var(--el-color-warning-light-3)',
            'var(--el-color-warning)',
          ]"
          :icons="[ElIconStarFilled, ElIconStarFilled, ElIconStarFilled]"
          :texts="['很差', '差', '还行', '满意', '非常满意']"
        />
      </div>
      <div class="flex opacity-70">
        <el-checkbox
          v-model="dto.isRecommend"
          :disabled="isDisable"
        >
          <small>推 荐</small>
        </el-checkbox>
        <el-checkbox
          v-model="dto.isAnonymous"
          :disabled="isDisable"
        >
          <small>匿 名</small>
        </el-checkbox>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.v-md-editor) {
  box-shadow: none;
  border-radius: 10px;
  overflow: hidden;
}
:deep(.el-textarea__inner) {
  box-shadow: none;
  padding: 0.8rem;
}
:deep(.el-rate__text) {
  font-size: 0.95em;
}
</style>
