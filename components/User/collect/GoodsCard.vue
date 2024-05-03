<script lang="ts" setup>
import currency from "currency.js";
import type { GoodsCollectVO } from "@/composables/api/goods/collect";

const { data } = defineProps<{
  data: GoodsCollectVO
}>();

defineEmits(["link", "cancel"]);
</script>

<template>
  <div
    class="group w-full flex flex-col cursor-pointer border-transparent rounded-4px dark:border-transparent"
  >
    <!-- 商品图片  -->
    <div class="img relative h-8rem w-full overflow-hidden rounded-t-inherit md:h-9rem">
      <CardElImage
        loading="lazy"
        class="h-full w-full"
        :src="BaseUrlImg + data.goods.images[0]"
        :alt="data.goods.name"
        fit="cover"
        @click="$emit('link')"
      />
      <div class="absolute left-0 top-0">
        <slot name="btns" />
      </div>
      <!-- 商品收藏 -->
      <small
        class="group absolute right-0 top-0 m-2 bg-light py-0.6 pl-2.6 pr-1.8 text-0.8rem text-black opacity-100 shadow v-card dark:text-light hover:text-[var(--el-color-danger)] group-hover:opacity-100 md:opacity-0"
        @click="$emit('cancel', data.goods.id)"
      >
        <div class="inline text-dark dark:text-light">取消收藏</div>
        <i
          i-solar:star-bold ml-1 p-0.6em text-yellow-4
        />
      </small>
      <!-- 浏览量 -->
      <small
        class="view absolute bottom-0 left-0 z-1 w-full flex-row-bt-c bg-[var(--el-bg-color-primary)] px-3 py-1 color-light opacity-0 backdrop-blur-2em transition-300"
        group-hover:opacity-80
      >
        <div class="icon">
          <i class="i-solar:eye-bold mr-1 p-2" />
          {{ data.goods.views }}
        </div>
      </small>
    </div>
    <!-- 商品名 -->
    <div
      class="relative h-1/3 flex flex-col justify-between justify-around px-2 py-2 md:px-3"
      @click="$emit('link')"
    >
      <h4 class="w-full truncate">
        {{ data.goods.name }}
      </h4>
      <p
        color-red-5
        class="texts"
      >
        <strong pr-1>￥{{ currency(data.goods.price) }}</strong>
        <small


          hidden text-0.6em color-coolgray md:inline
          style="text-decoration: line-through"
        >
          ￥{{ currency(data.goods.costPrice) }}
        </small>
      </p>
    </div>
  </div>
</template>
