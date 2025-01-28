<script lang="ts" setup>
import { ListTransitionGroup } from "#components";

const emit = defineEmits<{
  (e: "submit", data: ChatUserSeInfoVO): void
}>();
// 搜索相关
const searchKeyWords = ref<string>("");
const isShowResult = ref<boolean>(false);
const searchPage = ref({
  total: 0,
  pages: 0,
  size: 0,
  current: 0,
});
const searchPageList = reactive<ChatUserSeInfoVO[]>([]);
// 分页器
const user = useUserStore();
const isLoading = ref<boolean>(false);
const page = ref<number>(0);
const size = ref<number>(10);
const noMore = computed(() => searchPage.value.total > 0 && searchPageList.length >= searchPage.value.total);
// 搜索历史 本地存储
const searchHistoryList = useStorageAsync<string[]>("jiwu_chat_friend_user", []);
/**
 * 搜索好友
 */
async function onSearch() {
  if (!searchKeyWords.value) {
    // 清空
    clearSearch();
    return;
  }
  reSearch();
  // 1、请求
  // 添加记录
  if (
    !searchHistoryList.value.includes(searchKeyWords.value)
    && searchHistoryList.value.length <= 6
  ) {
    searchHistoryList.value.unshift(searchKeyWords.value.trim());
  }
  else {
    searchHistoryList.value.pop();
  }

  await onLoadMore();
}

async function onLoadMore() {
  try {
    if (noMore.value || isLoading.value)
      return;
    isLoading.value = true;
    page.value++;
    const res = await getUserSeListByPage(page.value, size.value, {
      keyWord: searchKeyWords.value,
    }, user.getToken);
    // 展示结果
    searchPage.value = {
      total: res.data.total,
      pages: res.data.pages,
      size: res.data.size,
      current: res.data.current,
    };
    searchPageList.push(...res.data.records);
  }
  catch (e) {
    console.error(e);
  }
  finally {
    isLoading.value = false;
    isShowResult.value = true;
  }
}

/**
 * 清除
 */
function clearSearch() {
  isShowResult.value = false;
  searchKeyWords.value = "";
  searchPageList.splice(0);
  searchPage.value = {
    total: 0,
    pages: 0,
    size: 0,
    current: 0,
  };
}
function reSearch() {
  searchPageList.splice(0);
  searchPage.value = {
    total: 0,
    pages: 0,
    size: 0,
    current: 0,
  };
  page.value = 0;
}
/**
 * 关闭历史标签
 * @param tag
 */
function handleClose(tag: string) {
  searchHistoryList.value.splice(searchHistoryList.value.indexOf(tag), 1);
}
/**
 * 点击历史标签
 */
function clickTag(val: string, i: number) {
  searchHistoryList.value.splice(i, 1);
  searchHistoryList.value.push(val);
  searchKeyWords.value = val;
  onSearch();
}
const isShowModel = ref(false);

const timer = ref<any>();
</script>

<template>
  <div class="h-full w-full flex flex-col" relative>
    <div
      class="v-input"
      flex-row-c-c
    >
      <ElInput
        id="user-search-apply-input"
        v-model.trim="searchKeyWords"
        class="mr-2"
        type="text"
        clearable
        autocomplete="off"
        :prefix-icon="ElIconSearch"
        minlength="2"
        maxlength="30"
        :on-search="onSearch"
        placeholder="搜索好友 🔮"
        @focus="isShowModel = true"
        @keyup.esc="clearSearch"
        @keyup.enter="onSearch"
      />
      <BtnElButton
        type="primary"
        class="w-5rem shadow"
        style=" position: relative;transition: 0.2s"
        :disabled="isLoading"
        icon-class="i-solar:magnifer-outline mr-2"
        @focus="isShowModel = true"
        @click.self="onSearch"
      >
        搜索
      </BtnElButton>
    </div>
    <div v-if="isShowModel" class="absolute left-0 top-2.5rem z-1 h89vh w-full flex-1 bg-color">
      <!-- 搜索历史记录 -->
      <ClientOnly>
        <div
          class="tags transform-origin-top-center scale-y-0 op-0 transition-200 transition-all group-hover:(scale-y-100 op-100)"
          absolute top-0 top-40px z-0 flex flex-nowrap cursor-pointer flex-items-center py-1
        >
          <small mt-2 op-60>历史记录：</small>
          <ElTag
            v-for="(p, i) in searchHistoryList"
            :key="p + i"
            closable
            class="mr-1 mt-2 transition-300"
            @close="handleClose(p)"
            @click="clickTag(p, i)"
          >
            <span pr-0.3em>{{ p }}</span>
          </ElTag>
        </div>
      </ClientOnly>
      <!-- 标题 -->
      <div class="mt-2 flex-row-bt-c pr-2">
        <span
          v-show="searchPageList.length > 0"
          class="text-0.8rem"
        >
          {{ ` 找到 ${searchPage.total} 个匹配好友` }}
        </span>
        <i i-solar:close-circle-bold class="ml-a p-2 btn-danger" @click="isShowModel = false" />
      </div>
      <el-scrollbar
        v-show="isShowResult && searchPage.current && searchPageList.length > 0"
        wrap-class="pb-6 flex-1  overflow-hidden"
        class="h-full pb-6"
      >
        <ListAutoIncre
          :immediate="false"
          :no-more="noMore"
          @load="onLoadMore"
        >
          <ListTransitionGroup tag="div" class="py-2">
            <!-- 用户卡片 -->
            <div
              v-for="p in searchPageList"
              :key="p.id"
              class="relative mb-2 flex cursor-pointer items-center truncate p-2 transition-300 transition-all card-default bg-color-2 hover:(bg-gray-200 shadow-sm dark:bg-dark-9)"
              @click="emit('submit', p)"
            >
              <CardElImage
                :src="BaseUrlImg + p.avatar"
                fit="cover"
                class="mr-2 h-2.2rem w-2.2rem object-cover border-default card-default"
              />
              <small>{{ p.nickname || p.username }}</small>
            </div>
          </ListTransitionGroup>
          <template #done>
            <p text-center text-mini>
              暂无更多
            </p>
          </template>
        </ListAutoIncre>
      </el-scrollbar>
      <ElEmpty
        v-show="!searchPage.total"
        mt-10
        :image-size="80"
        :description="searchPageList.length <= 0 && searchPage.current > 0 ? '没有找到好友' : '好友查找'"
      >
        <template #image>
          <i i-solar:users-group-two-rounded-bold-duotone p-2rem op-40 />
        </template>
      </ElEmpty>
    </div>
  </div>
</template>

<!-- 样式scss -->
<style scoped lang="scss">
.v-input {
  :deep(.el-button) {
    font-size: 0.8rem;
    padding: 0 2rem;
    margin-right: 0;
    letter-spacing: 0.2em;
  }
  :deep(.el-input__wrapper) {
    transition: $transition-delay;
    --at-apply: "tracking-0.2em";
    &.is-focus {
      backdrop-filter: blur(20px);
    }
  }
}

// 弹出框
.popover {
  display: flex;
  flex-direction: column;
  align-items: center;

  &hover {
    width: 100%;
  }

  :deep(.el-popover__title) {
    width: 100%;
    text-align: center !important;
  }
}

.tags .el-tags .el-tag__content {
  :deep(.el-close) {
    opacity: 0;
  }

  :deep(.el-close):hover {
    opacity: 1;
  }
}
</style>
