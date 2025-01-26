<script lang="ts" setup>
import type { ExtendItem } from "./extension";
import { useOpenExtendWind } from "./extension";

/**
 * 扩展菜单弹窗
 */
const props = defineProps<{
  show: boolean | undefined | null
}>();
const emit = defineEmits<{
  (e: "update:show", value: boolean | undefined | null): void
  (e: "submit", value: ChatMessageDTO): void
}>();
const isShow = computed({
  get: () => props.show !== undefined && props.show === true,
  set: value => emit("update:show", value),
});
const setting = useSettingStore();
const {
  open,
  // openItem,
} = useOpenExtendWind();
// 扩展菜单列表
const extendMenuAllList = ref<ExtendItem[]>([
  {
    url: "/extend/shop",
    title: "极物圈商城",
    icon: "i-solar:shop-line-duotone",
    activeIcon: "i-solar:shop-bold-duotone",
    loading: false,
    saveTime: undefined,
    disabled: false,
  },
  {
    url: "/extend/blog",
    title: "博客",
    icon: "i-solar:notebook-bookmark-broken",
    activeIcon: "i-solar:notebook-bookmark-bold-duotone",
    loading: false,
    saveTime: undefined,
    disabled: false,
  },
  {
    url: "/extend/wallet",
    title: "我的钱包",
    icon: "i-solar:wallet-money-line-duotone",
    activeIcon: "i-solar:wallet-money-bold-duotone",
    loading: false,
    saveTime: undefined,
    disabled: true,
  },
  {
    url: "/extend/doc",
    title: "极物文档",
    icon: "i-solar:document-add-outline",
    activeIcon: "i-solar:document-add-bold-duotone",
    loading: false,
    saveTime: undefined,
    disabled: true,
  },
  // 其他
  {
    title: "建设中",
    icon: "i-carbon:settings-adjust",
    saveTime: undefined,
    disabled: true,
  },
]);

// 暂存的扩展菜单
const extendMenuSaveList = ref<ExtendItem[]>([]);

// 添加
function onAdd(item: ExtendItem) {
  if (extendMenuSaveList.value.findIndex(menu => menu.title === item.title) !== -1) {
    return;
  }
  item.saveTime = Date.now();
  extendMenuSaveList.value.push(item);
}
// 移除
function onRemove(item: ExtendItem) {
  const index = extendMenuSaveList.value.findIndex(menu => menu.title === item.title);
  if (index > -1) {
    extendMenuSaveList.value[index]!.saveTime = undefined;
    extendMenuSaveList.value.splice(index, 1);
  }
}

onMounted(() => {
  // 加载扩展菜单
  extendMenuSaveList.value = setting.selectExtendMenuList.map(item => extendMenuAllList.value.find(menu => menu.title === item.title)).filter(item => item) as ExtendItem[];
});
// 保存菜单设置
function saveMenu(list: ExtendItem[]) {
  setting.selectExtendMenuList = JSON.parse(JSON.stringify(list.sort((a, b) => (b.saveTime || 0) - (a.saveTime || 0))));
  isShow.value = false;
}
// @unocss-include
const loadingIcon = `<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M12 4.5a7.5 7.5 0 1 0 0 15a7.5 7.5 0 0 0 0-15M1.5 12C1.5 6.201 6.201 1.5 12 1.5S22.5 6.201 22.5 12S17.799 22.5 12 22.5S1.5 17.799 1.5 12" opacity=".1"/><path fill="currentColor" d="M12 4.5a7.46 7.46 0 0 0-5.187 2.083a1.5 1.5 0 0 1-2.075-2.166A10.46 10.46 0 0 1 12 1.5a1.5 1.5 0 0 1 0 3"/></g></svg>`;

// 菜单列表动画
// const el = useTemplateRef("listRef");
</script>

<template>
  <el-dialog
    v-model="isShow"
    center width="fit-content"
    append-to-body
    class="border-default !bg-color-2"
  >
    <template #header>
      <i i-solar:widget-line-duotone mr-2 p-2.5 text-small />
      扩展菜单
    </template>
    <!-- 合并后的菜单 -->
    <ListTransitionGroup
      tag="div"
      name="pop-list"
      class="grid grid-auto-rows-min cols-4 mb-4 mt-2 min-h-14em select-none items-start gap-2 sm:gap-4"
    >
      <!-- 固定菜单标题 -->
      <small v-if="extendMenuSaveList.length" key="fix-title" class="col-span-full block text-mini">
        固定菜单
      </small>
      <template v-for="item in extendMenuSaveList" :key="item.title">
        <div
          v-loading="item.loading"
          :element-loading-spinner="loadingIcon"
          element-loading-custom-class="text-.5em"
          class="group relative h-6em w-5.5em flex-row-c-c flex-col cursor-pointer rounded text-center bg-color hover:shadow border-default-hover"
          :title="item.title"
          :class="{
            'not-link': item.disabled,
            [`${item.class || ''}`]: item.class,
          }"
        >
          <i
            class="mx-a block h-1.6em w-1.6em"
            :class="item.icon"
            @click.stop="open(item)"
          />
          <div
            class="absolute right-1 top-1 op-0 btn-danger-bg bg-color group-hover:(op-100)"
            @click.stop="onRemove(item)"
          >
            <i class="i-carbon:subtract p-2 p-2.2 text-color" />
          </div>
          <div
            class="mx-a mt-2 text-center text-xs"
            @click.stop="open(item)"
          >
            {{ item.title }}
          </div>
        </div>
      </template>
      <!-- 其他菜单标题 -->
      <small key="pop-title" class="col-span-full block text-mini">
        已折叠菜单
      </small>
      <!-- 其他菜单项 -->
      <template v-for="item in extendMenuAllList.filter(item => !extendMenuSaveList.includes(item))" :key="item.title">
        <div
          v-loading="item.loading"
          :element-loading-spinner="loadingIcon"
          element-loading-custom-class="text-.5em"
          class="group relative h-6em w-5.5em flex-row-c-c flex-col cursor-pointer rounded text-center bg-color hover:shadow border-default-hover"
          :title="item.title"
          :class="{
            'not-link': item.disabled,
            [`${item.class || ''}`]: item.class,
          }"
        >
          <i
            class="mx-a block h-1.6em w-1.6em" :class="item.icon"
            @click.stop="open(item)"
          />
          <div
            v-if="!item.disabled"
            class="absolute right-1 top-1 op-0 btn-primary-bg bg-color group-hover:(op-100)"
            @click.stop="onAdd(item)"
          >
            <i class="i-carbon:add p-2 p-2.2 text-color" />
          </div>
          <div
            class="mx-a mt-2 text-center text-xs"
            @click.stop="open(item)"
          >
            {{ item.title }}
          </div>
        </div>
      </template>
    </ListTransitionGroup>
    <template #footer>
      <div class="px-3 pb-2 text-right">
        <el-button class="ml-a" size="small" @click="isShow = false">
          取消
        </el-button>
        <el-button type="primary" size="small" @click="saveMenu(extendMenuSaveList)">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
/* 新增拖拽样式 */
.ghost {
  --at-apply: "op-50 bg-color-3";
}
.chosen {
  --at-apply: "cursor-grabbing";
}
.drag {
  --at-apply: "shadow-lg transform scale-105 z-10";
}

.text-input {
  :deep(.el-textarea__inner) {
    resize: none;
    box-shadow: none !important;
    background-color: transparent;
    caret-color: var(--el-color-primary);
  }
}
.not-link {
  &,
  &:hover {
    --at-apply: "!border-color-transparent cursor-not-allowed dark:op-60 shadow-none";
  }
}
</style>

