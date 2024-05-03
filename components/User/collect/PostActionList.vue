<script lang="ts" setup>
import type { CommPostActionVO, SelectCommPostActionPageDTO } from "@/composables/api/community/post";

// props
interface Props {
  dto: SelectCommPostActionPageDTO
  limit?: number
  class?: string
  cardClass?: string
  title?: string
}
const props = withDefaults(defineProps<Props>(), {
  dto: () => {
    return {
      isPostInfo: 1,
    };
  },
  class: "",
  cardClass: "",
  title: "收藏",
});

const isLoading = ref<boolean>(false);
// 帖子列表
const postList = ref<CommPostActionVO[]>([]);
// 分页器
const page = ref<number>(0);
const size = ref<number>(props.limit || 10);
// 查询页信息
const pageInfo = reactive({
  total: -1,
  pages: -1,
  current: -1,
});
// 暂无
const isNot = computed<boolean>(() => {
  return pageInfo?.total === 0 && pageInfo.pages === 0;
});
// 无更多
const isNoMore = computed<boolean>(() => {
  return pageInfo.pages > 0 && (page.value >= pageInfo.pages || (props.limit !== undefined && props.limit <= postList.value.length));
});
const user = useUserStore();

async function loadPostListPage() {
  // 没有更多
  if (isLoading.value || isNoMore.value || isNot.value)
    return;
  if (props.limit !== undefined && postList.value.length >= props.limit) {
    isLoading.value = false;
    return;
  }
  isLoading.value = true;
  page.value++;
  const res = await getCommPostActionPage(page.value, size.value, props?.dto, user.getToken);
  // 展示结果
  if (res?.code !== StatusCode.SUCCESS)
    return;

  pageInfo.total = res?.data.total;
  pageInfo.current = res?.data.current;
  pageInfo.pages = res?.data.pages;
  if (res?.data.records && res?.data.records.length)
    postList.value.push(...res?.data.records);
  isLoading.value = false;
}
function clearResult() {
  postList.value.splice(0);
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
    await loadPostListPage();
    timer.value = setTimeout(() => {
      clearTimeout(timer.value);
      timer.value = null;
    }, 400);
  },
  {
    immediate: true,
  },
);

function onChancelCollect({ id, postId }: CommPostActionVO) {
  // 取消
  ElMessageBox.confirm(`是否取消${props?.title}？`, "取消提示", {
    confirmButtonText: "确 认",
    confirmButtonClass: "el-button--danger  border-default ",
    lockScroll: false,
    cancelButtonText: "取 消",
    center: true,
    callback: async (action: string) => {
      if (action === "confirm") {
        const { code } = await togglePostAction(postId, {
          postId,
          type: PostActionType.COLLECT,
        }, user.getToken);
        if (code === StatusCode.SUCCESS) {
          postList.value = postList.value.filter(item => item.id !== id);
          ElMessage.warning(`取消${props?.title}成功！`);
        }
      }
    },
  });
}


defineExpose({
  clearResult, // 清除
  loadPostListPage,
  postList,
  pageInfo,
});
</script>

<template>
  <el-scrollbar height="70vh">
    <ClientOnly>
      <div v-auto-animate class="grid grid-gap-6">
        <ListAutoIncre
          loading-class="mx-a my-0.6em h-1.4rem w-1.4rem animate-[spin_2s_infinite_linear] rounded-6px bg-[var(--el-color-info)]"
          :immediate="true"
          :no-more="isNoMore || isNot"
          @load="loadPostListPage"
        >
          <div
            v-for="p in postList"
            :key="p.id"
            class="grid grid-cols-1 gap-4"
          >
            <!-- 帖子卡片 -->
            <UserCollectPostCardSe :data="p" :dto="dto" @cancel="onChancelCollect" />
          </div>
          <template #done>
            <p
              v-show="isNoMore || isNot" class="w-full py-8"
              text-center text-bluegray tracking-1
            >
              {{ isNoMore ? "暂无更多帖子" : "暂无帖子" }}
            </p>
          </template>
        </ListAutoIncre>
      </div>
    </ClientOnly>
  </el-scrollbar>
</template>

<style scoped lang="scss">
:deep(.el-loading-mask) {
  background-color: transparent;
}
</style>
