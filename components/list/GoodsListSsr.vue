<script lang="ts" setup>
import { TransitionGroup } from "vue";
import { type GoodsPageDTO } from "@/composables/api/goods";
import type { GoodsVO } from "~/types/goods";

// props
interface Props {
  dto: GoodsPageDTO
  /** 列表布局class */
  class?: string
  limit?: number
  load?: boolean
  isTimer?: boolean
  showMoreText?: boolean
  immediate?: boolean
  transiton?: string
  cardLoadClass?: string
}
const props = withDefaults(defineProps<Props>(), {
  isTimer: true,
  dto: () => {
    return {};
  },
  cardLoadClass: "",
  immediate: true,
  showMoreText: true,
});

const isLoading = ref<boolean>(false);
// 商品列表
const goodsList = ref<GoodsVO[]>([]);
// 分页器
const page = ref<number>(0);
const size = ref<number>(props.limit || 10);
// 查询页信息
const pageInfo = reactive({
  total: -1,
  pages: -1,
  current: -1,
});

const isNot = computed<boolean>(() => {
  return pageInfo?.total === 0 && pageInfo.pages === 0;
});
const isNoMore = computed<boolean>(() => {
  if (pageInfo.pages > 0 && (page.value >= pageInfo.pages || (props.limit !== undefined && props.limit <= goodsList.value.length)))
    return true;
  else
    return false;
});

async function loadGoodsPage() {
  // 没有更多
  if (isLoading.value || isNoMore.value || isNot.value)
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
  goodsList.value.push(...data.records.map((p) => {
    p.images = typeof p.images === "string" ? p.images.split(",") : [];
    return p;
  }));
  isLoading.value = false;
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
watchDebounced(
  dto,
  async () => {
    clearResult();
    await loadGoodsPage();
  },
  {
    deep: true,
  },
);

defineExpose({
  clearResult, // 清除
  loadGoodsPage,
  goodsList,
  pageInfo,
});
if (props.immediate)
  await loadGoodsPage();
</script>

<template>
  <div>
    <component
      :is="props.transiton ? TransitionGroup : 'div'"
      tag="div"
      :name="transiton || 'fade-bt-list'"
      class="pb-4"
      :class="props.class !== null ? props.class : 'flex flex-wrap'"
    >
      <NuxtLink
        v-for="p in goodsList"
        :key="p.id"
        :to="`/goods/detail/${p.id}`"
      >
        <!-- 商品卡片 -->
        <CardGoodsBoxSsr
          class="mt-4/100 transition-300 v-card"
          :goods="p"
          :load-class="cardLoadClass"
        >
          <small class="ml-a mt-2px text-blueGray">
            <i i-solar:fire-bold-duotone bg-red-5 p-0.6em />
            {{ p.sales }}
          </small>
        </CardGoodsBoxSsr>
      </NuxtLink>
    </component>
    <small
      v-show="isNoMore || isNot"
      v-if="showMoreText"
      mt-2 block w-full text-center text-bluegray tracking-1
    >
      {{ isNoMore ? "暂无更多商品" : "暂无商品" }}
    </small>
    <!-- 加载更多 -->
    <el-text v-if="showMoreText && !isNoMore && !isNot" mt-4 block w-full cursor-pointer text-center @click="loadGoodsPage()">
      加载更多
    </el-text>
  </div>
</template>

<style scoped lang="scss">
:deep(.el-loading-mask) {
  background-color: transparent;
}
</style>
