<script lang="ts" setup>
const isLoading = ref<boolean>(false);
const isEdit = ref<boolean>(false);
const user = useUserStore();

// 收藏列表
const list = useAsyncData(async () => {
  if (isLoading.value)
    return;
  const { data, code } = await getGoodsCollectList(user.getToken);
  data.forEach((item) => {
    item.goods.images = typeof item.goods.images === "string" ? item.goods.images.split(",") : [];
  });
  setTimeout(() => {
    isLoading.value = false;
  }, 300);
  if (code === StatusCode.SUCCESS)
    return data;
  else
    return [];
});
/**
 * 单个取消收藏
 * @param gId 商品id
 */
function cancelCollect(gId: string) {
  if (isLoading.value)
    return;
  ElMessageBox.confirm("是否取消收藏？", "取消提示", {
    confirmButtonText: "确 认",
    confirmButtonClass: "el-button--warning is-plain border-default ",
    lockScroll: false,
    cancelButtonText: "取 消",
    center: true,
    callback: async (action: string) => {
      if (action === "confirm") {
        isLoading.value = true;
        const { code } = await toggleGoodsCollectStatus(gId, user.getToken);
        if (code === StatusCode.SUCCESS) {
          if (list.data.value) {
            for (let i = 0; i < list.data.value.length; i++) {
              if (list.data.value[i].goods.id === gId) {
                list.data.value.splice(i, 1);
                break;
              }
            }
          }
          ElMessage.success("取消成功！");
        }
        else {
          ElMessage.error("取消失败！");
        }
      }
      isLoading.value = false;
    },
  });
}

// 选中集合
const selectIdsList = ref<string[]>([]);
// 全选
const isSelectAll = computed({
  get() {
    return selectIdsList.value.length === list.data.value?.length;
  },
  set(val: boolean) {
    if (val)
      selectIdsList.value = list.data.value?.map(p => p.goods.id) || [];

    else
      selectIdsList.value.splice(0);
  },
});
watchDebounced(isEdit, (val: boolean) => {
  if (!val)
    selectIdsList.value.splice(0);
});
/**
 * 取消收藏（批量）
 */
function batchCancelCollect() {
  if (isLoading.value || selectIdsList.value.length === 0)
    return ElMessage.warning("请选中取消的商品！");

  ElMessageBox.confirm(`是否取消${selectIdsList.value.length}个商品收藏？`, "取消提示", {
    confirmButtonText: "确 认",
    confirmButtonClass: "el-button--danger  border-default ",
    cancelButtonText: "取 消",
    lockScroll: false,
    center: true,
    callback: async (action: string) => {
      if (action === "confirm") {
        const { code } = await deleteBatchGoodsCollectByIds(selectIdsList.value, user.getToken);
        if (code === StatusCode.SUCCESS) {
          if (list.data.value)
            list.data.value = list.data.value.filter(p => !selectIdsList.value.includes(p.id));
          selectIdsList.value.splice(0);
          ElMessage.success("取消成功！");
        }
        else {
          ElMessage.error("取消失败！");
        }
      }
    },
  });
}

async function reload() {
  isLoading.value = true;
  setTimeout(async () => {
    isLoading.value = false;
    await list.refresh();
  }, 300);
}
</script>

<template>
  <div v-loading.fullscreen.lock="isLoading" overflow-x-hidden>
    <!-- 顶部按钮 -->
    <div class="mb-3 flex-row-bt-c">
      <small opacity-60>操 作 ：</small>
      <div class="btns flex">
        <div
          class="w-0 flex justify-between overflow-hidden truncate opacity-80 transition-300 transition-width"
          :class="{ 'w-14.8em': isEdit }"
          mr-2
        >
          <el-button
            size="small"
            @click="reload"
          >
            <i
              class="i-solar:refresh-outline h-1em w-1em cursor-pointer bg-[var(--el-color-info)] transition-300 hover:rotate-180"
              mr-2
            />
            刷新
          </el-button>
          <el-checkbox
            v-model="isSelectAll"
            :border="true"
            label="全选"
            size="small"
          />
          <el-button
            plain
            type="danger"
            :icon="ElIconDelete"
            size="small"
            @click="batchCancelCollect"
          >
            批量
            <div
              hidden
              md:inline
            >
              取消
            </div>
          </el-button>
        </div>
        <el-button
          size="small"
          plain
          type="info"
          @click="isEdit = !isEdit"
        >
          {{ isEdit ? "取消" : "管理" }}
        </el-button>
      </div>
    </div>
    <!-- 收藏列表 -->
    <el-scrollbar
      height="62vh"
      overflow-x-hidden
      rounded-8px
    >
      <el-checkbox-group
        v-model="selectIdsList"
        :disabled="!isEdit"
      >
        <div
          v-auto-animate="{
            duration: 300,
            easing: 'cubic-bezier(0.61, 0.225, 0.195, 1.3)',
          }"
          grid="~ cols-2 md:cols-5 gap-6"
        >
          <div
            v-for="p in list.data.value"
            :key="p.id"
          >
            <el-checkbox-button
              :label="p.id"
              class="transition-300 active:scale-96 hover:shadow"
            >
              <UserCollectGoodsCard
                :data="p"
                @link="!isEdit && navigateTo(`/goods/detail/${p.goods.id}`)"
                @cancel="cancelCollect"
              >
                <template #btns />
              </UserCollectGoodsCard>
            </el-checkbox-button>
          </div>
        </div>
      </el-checkbox-group>
      <small
        mt-6 block text-center opacity-60
      >
        {{ list.data.value?.length ? "暂无更多收藏" : "还没有收藏噢，快去逛一逛商品吧" }}
      </small>
    </el-scrollbar>
  </div>
</template>

<style scoped lang="scss">
:deep(.el-checkbox-group) {
  font-size: inherit;
  line-height: inherit;

  .el-checkbox-button {
    display: inherit;
    border: 2px solid  rgb(184 184 184 / 10%) ;
    border-radius: 6px;

    .el-checkbox-button__inner {
      width: 100%;
      height: 100%;
      padding: 0;
      font-size: inherit;
      text-align: start;
      color: inherit;
      background: inherit;
      border: 0;
      border-radius: 6px;
      line-height: inherit;
    }
  }
  $check-color: var(--el-color-info);

  .is-checked {
    position: relative;
    overflow: hidden;
    border-color: $check-color;
    box-shadow: rgb(0 0 0 / 15%) 1.95px 1.95px 2.6px;

    &::after {
      position: absolute;
      right: 0;
      bottom: 0;
      z-index: 1;
      transition: 300;
      content: "选中";
      width: 8em;
      height: 4em;
      margin-left: 0.5em;
      font-size: 1em;
      text-align: center;
      color: #fff;
      background: $check-color;
      opacity: 100;
      box-shadow: 0 -4px 10px rgb(0 0 0 / 20%);
      line-height: 2.4em;
      transform: rotate(-45deg) translate(20%, 60%);
    }
  }
}
</style>
