<script lang="ts" setup>
import { type GoodsPageDTO } from "@/composables/api/goods";
import type { GoodsVO } from "~/types/goods";

// props
interface Props {
  dto: GoodsPageDTO
  /** 列表布局class */
  class?: string
  size?: number
  limit?: number
  load?: boolean
  isTimer?: boolean
  showMoreText?: boolean
  immediate?: boolean
  autoStop?: boolean
  transiton?: string
}
const props = withDefaults(defineProps<Props>(), {
  isTimer: true,
  dto: () => {
    return {};
  },
  immediate: true,
  autoStop: true,
  size: 10,
  showMoreText: true,
  transiton: "fade-bt-list",
});

const isLoading = ref<boolean>(false);
// 商品列表
const goodsList = ref<GoodsVO[]>([]);
// 分页器
const page = ref<number>(0);
const size = ref<number>(props.limit || props.size || 10);
// 查询页信息
const pageInfo = reactive({
  total: -1,
  pages: -1,
  current: -1,
});

const isNot = computed<boolean>(() => {
  return pageInfo.total === 0 && pageInfo.pages === 0;
});
const isNoMore = computed<boolean>(() => {
  return pageInfo.pages > 0 && page.value >= pageInfo.pages;
});

async function loadGoodsPage() {
  // 没有更多
  if (isNoMore.value || isNot.value)
    return;
  if (props.limit !== undefined && goodsList.value.length >= props.limit) {
    isLoading.value = false;
    return;
  }
  isLoading.value = true;
  page.value++;
  const { data } = await getGoodsListByPage(page.value, size.value, props?.dto);
  // 展示结果
  pageInfo.total = data.total;
  pageInfo.current = data.current;
  pageInfo.pages = data.pages;
  if (props.isTimer) {
    for await (const p of data.records) {
      p.images = typeof p.images === "string" ? p.images.split(",") : [];
      goodsList.value.push(Object.freeze(p));
    }
  }
  else {
    goodsList.value.push(...Object.freeze(data.records.map((p) => {
      p.images = typeof p.images === "string" ? p.images.split(",") : [];
      return p;
    })));
  }
  if (props.immediate) {
    isLoading.value = false;
  }
  else {
    setTimeout(() => {
      isLoading.value = false;
    }, 300);
  }
}
function clearResult() {
  goodsList.value.splice(0);
  pageInfo.total = -1;
  pageInfo.pages = -1;
  pageInfo.current = -1;
  page.value = 0;
}
// 条件筛选
const dto = toReactive(props.dto);
const timer = ref();
watchDebounced(
  dto,
  async () => {
    if (timer.value)
      return;
    clearResult();
    await loadGoodsPage();
    timer.value = setTimeout(() => {
      clearTimeout(timer.value);
      timer.value = null;
    }, 400);
  },
  {
  },
);

if (props.immediate)
  loadGoodsPage();


defineExpose({
  clearResult, // 清除
  loadGoodsPage,
  goodsList,
  pageInfo,
});
</script>

<template>
  <ListAutoIncre
    :immediate="immediate"
    :no-more="isNoMore || isNot"
    :loading="isLoading || !immediate"
    :auto-stop="autoStop"
    @load="loadGoodsPage"
  >
    <slot name="pre" />
    <template #load>
      <slot name="load" />
    </template>
    <transition-group
      tag="div"
      :name="transiton"
      class="pb-4"
      :class="props.class !== null ? props.class : 'flex flex-wrap'"
    >
      <NuxtLink
        v-for="p in goodsList"
        :key="p.id"
        :to="`/goods/detail/${p.id}`"
      >
        <!-- 商品卡片 -->
        <CardGoodsBox
          class="mt-4/100 transition-300 v-card"
          :goods="p"
        >
          <small class="ml-a mt-2px text-blueGray">
            <i i-solar:fire-bold-duotone bg-red-5 p-0.6em />
            {{ p.sales }}
          </small>
        </CardGoodsBox>
      </NuxtLink>
    </transition-group>
    <template #done>
      <p
        v-show="isNoMore || isNot"
        v-if="showMoreText" class="w-1/1 py-8"

        text-center text-bluegray tracking-1
      >
        {{ isNoMore ? "暂无更多商品" : "暂无商品" }}
      </p>
    </template>
  </ListAutoIncre>
</template>

<style scoped lang="scss">
:deep(.el-loading-mask) {
  background-color: transparent;
}
</style>
