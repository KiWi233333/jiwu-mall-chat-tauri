<script lang="ts" setup>
import type { OrderGoodsSkuVO, OrdersItemVO } from "@/composables/api/orders";

const { orderItem } = defineProps<{
  orderItem: OrdersItemVO
}>();

// 商品规格
function getProps(p: OrderGoodsSkuVO): string {
  return `${p?.size || ""} ${p?.color || ""} ${p?.combo || ""}`;
}
</script>

<template>
  <div class="goods flex">
    <card-el-image
      loading="lazy"
      fit="cover"
      class="h-4rem w-4rem overflow-hidden rounded-6px border-default"
      :src="
        `${BaseUrlImg + orderItem.goodsSku.image}?imageView2/0/w/100/h/100/format/webp/interlace/1/q/50`
      "
    />
    <div class="flex flex-col justify-around px-4">
      <small>{{ orderItem.goods.name }}</small>
      <small opacity-60>
        {{ getProps(orderItem.goodsSku) }}
      </small>
    </div>
  </div>
</template>
