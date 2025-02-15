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
} = useOpenExtendWind();
// 扩展菜单列表
const extendMenuAllList = ref<ExtendItem[]>([
  {
    url: "/extend/shop",
    title: "极物圈商城",
    icon: "i-solar:shop-line-duotone group-hover:(i-solar:shop-bold-duotone bg-[#5d33f6] transition-200 p-3)",
    activeIcon: "i-solar:shop-bold-duotone",
    loading: false,
    saveTime: undefined,
    disabled: false,
  },
  {
    url: "/extend/readjoy",
    title: "悦读时光",
    icon: "i-solar:notebook-square-line-duotone group-hover:(i-solar:notebook-square-bold-duotone transition-200 p-3 color-[#2f7efd])",
    activeIcon: "i-solar:notebook-square-bold-duotone",
    loading: false,
    saveTime: undefined,
    disabled: false,
  },
  {
    url: "/extend/blog",
    title: "博客",
    icon: "i-solar:chat-square-code-line-duotone p-2.6 group-hover:(i-solar:chat-square-code-bold-duotone transition-200 p-2.8 color-[#add7da])",
    activeIcon: "i-solar:chat-square-code-bold-duotone",
    loading: false,
    saveTime: undefined,
    disabled: false,
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
  setting.selectExtendMenuList = JSON.parse(JSON.stringify(list.sort((a, b) => (a.saveTime || 0) - (b.saveTime || 0))));
  isShow.value = false;
}
// @unocss-include
// 菜单列表动画
// const el = useTemplateRef("listRef");
function createItem() {
  ElMessage.warning("功能暂未开放");
  // ElMessageBox.prompt("",{
  //   title: "添加私人扩展",
  //   inputType: "text",
  //   inputPlaceholder: "请输入扩展名称",
  //   inputValue: "",
  //   confirmButtonText: "确定",
  //   cancelButtonText: "取消",
  //   inputValidator: (value: string) => {
  //     if (value.trim() === "") {
  //       return "请输入扩展名称";
  //     }
  //     if (extendMenuSaveList.value.findIndex(menu => menu.title === value.trim()) !== -1) {
  //       return "扩展名称已存在";
  //     }
  //     return true;
  //   },
  //   callback: (value: string) => {
  //     if (value) {
  //       const item: ExtendItem = {
  //         url: "",
  //         title: value.trim(),
  //         icon: "",
  //         activeIcon: "",
  //         loading: false,
  //         saveTime: undefined,
  //         disabled: false,
  //       };
  //       onAdd(item);
  //     }
  //   },
  // });
}
</script>

<template>
  <el-dialog
    v-model="isShow"
    center
    width="fit-content"
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
          :element-loading-spinner="defaultLoadingIcon"
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
            @click.stop="!item.disabled && open(item)"
          />
          <div
            class="absolute right-1 top-1 op-0 btn-danger-bg bg-color group-hover:(op-100)"
            @click.stop="onRemove(item)"
          >
            <i class="i-carbon:subtract p-2 p-2.2" />
          </div>
          <div
            class="mx-a mt-2 text-center text-xs"
            @click.stop="!item.disabled && open(item)"
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
          :element-loading-spinner="defaultLoadingIcon"
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
            @click.stop="!item.disabled && open(item)"
          />
          <div
            v-if="!item.disabled && !setting.isMobileSize"
            class="absolute right-1 top-1 hidden op-0 sm:block btn-primary-bg bg-color group-hover:(op-100)"
            @click.stop="onAdd(item)"
          >
            <i class="i-carbon:add p-2 p-2.2" />
          </div>
          <div
            class="mx-a mt-2 text-center text-xs"
            @click.stop="!item.disabled && open(item)"
          >
            {{ item.title }}
          </div>
        </div>
      </template>
      <div
        key="add-item"
        class="group relative h-6em w-5.5em flex-row-c-c flex-col cursor-pointer rounded text-center bg-color hover:shadow border-default-hover"
        title="添加私人扩展"
        @click.stop="createItem()"
      >
        <i
          class="i-carbon:add mx-a block h-1.6em w-1.6em"
        />
        <div
          class="mx-a mt-2 text-center text-xs"
        >
          自定义
        </div>
      </div>
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
      <div class="mt-2 text-center text-mini" data-fade style="--start: 0.3s;">
        此为预览功能，正式上线前将调整。
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

