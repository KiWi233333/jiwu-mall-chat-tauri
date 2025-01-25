<script lang="ts" setup>
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

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

interface ExtendItem {
  icon: string;
  url?: string;
  title: string;
  class?: string;
  disabled?: boolean,
  loading?: boolean;
  saveTime?: number;
  onClick?: () => any;
}


// 扩展菜单列表
const extendMenuAllList = ref<ExtendItem[]>([
  {
    url: "/extend/shop?width=1500&height=960",
    title: "极物圈商城",
    icon: "i-solar:shop-line-duotone",
    loading: false,
    saveTime: undefined,
    disabled: false,
  },
  {
    url: "/extend/blog",
    title: "博客",
    icon: "i-solar:notebook-bookmark-broken",
    loading: false,
    saveTime: undefined,
    disabled: false,
  },
  {
    url: "/extend/wallet",
    title: "我的钱包",
    icon: "i-solar:wallet-money-line-duotone",
    loading: false,
    saveTime: undefined,
    disabled: true,
  },
  {
    url: "/extend/doc",
    title: "极物文档",
    icon: "i-solar:document-add-outline",
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

const extendMenuSaveList = computed(() => extendMenuAllList.value.filter(item => item.saveTime).sort((a, b) => (b?.saveTime || 0) - (a?.saveTime || 0)));
const openWindItem = ref<ExtendItem | null>(null);
// 打开扩展窗口
async function openExtendWind(item: ExtendItem) {
  if (!item.url || item.loading) {
    return;
  }
  if (item.disabled) {
    ElMessage.warning("暂未开放！");
    return;
  }
  // 判断是否已经打开
  if (setting.isDesktop) {
    const window = await WebviewWindow.getByLabel(EXTEND_WINDOW_LABEL);
    if (window) {
      if (openWindItem.value?.url !== item.url)
        ElMessage.warning("扩展窗口已经被占用！");
      nextTick(async () => {
        await window?.unminimize();
        await window?.show();
        await window?.setFocus();
      });
      return;
    }
  }
  item.loading = true;
  createWindow(EXTEND_WINDOW_LABEL, {
    url: item.url,
    title: item.title,
  })
    .then(() => {
      openWindItem.value = item;
    })
    .finally(() => {
      setTimeout(() => {
        item.loading = false;
      }, 300);
    });
}
function saveMenu() {
  isShow.value = false;
}

// @unocss-include
const loadingIcon = `<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M12 4.5a7.5 7.5 0 1 0 0 15a7.5 7.5 0 0 0 0-15M1.5 12C1.5 6.201 6.201 1.5 12 1.5S22.5 6.201 22.5 12S17.799 22.5 12 22.5S1.5 17.799 1.5 12" opacity=".1"/><path fill="currentColor" d="M12 4.5a7.46 7.46 0 0 0-5.187 2.083a1.5 1.5 0 0 1-2.075-2.166A10.46 10.46 0 0 1 12 1.5a1.5 1.5 0 0 1 0 3"/></g></svg>`;
</script>

<template>
  <el-dialog v-model="isShow" draggable center width="fit-content" append-to-body class="border-default !bg-color-2">
    <template #header>
      <i i-solar:widget-line-duotone mr-2 p-2.5 text-small />
      扩展菜单
    </template>
    <div class="grid cols-4 my-2 min-h-10em select-none items-start gap-2 p-4 sm:gap-4">
      <div
        v-for="(item, i) in extendMenuSaveList" :key="i"
        v-loading="item.loading"
        :element-loading-spinner="loadingIcon"
        class="group relative h-6em w-5.5em flex-row-c-c flex-col cursor-pointer rounded text-center bg-color hover:shadow border-default-hover"
        :title="item.title"
        :class="{ 'not-link': item.disabled, [`${item.class || ''}`]: item.class }"
        @click="openExtendWind(item)"
      >
        <i class="mx-a block h-1.6em w-1.6em" :class="item.icon" />
        <i class="i-carbon:add-alt absolute right-1 top-1 p-2 btn-info group-hover:(op-100)" />
        <div class="mx-a mt-2 text-center text-xs">
          {{ item.title }}
        </div>
      </div>
      <!-- 添加到侧边 -->
      <div
        v-for="(item, i) in extendMenuAllList" :key="i"
        v-loading="item.loading"
        class="group h-6em w-5.5em flex-row-c-c flex-col cursor-pointer rounded text-center bg-color hover:shadow border-default-hover"
        :title="item.title"
        :class="{
          'not-link': item.disabled,
          [`${item.class || ''}`]: item.class,
        }"
        @click="openExtendWind(item)"
      >
        <i class="mx-a block h-1.6em w-1.6em" :class="item.icon" />
        <div class="mx-a mt-2 text-center text-xs">
          {{ item.title }}
        </div>
      </div>
    </div>
    <template #footer>
      <div class="px-3 pb-2 text-right">
        <el-button class="ml-a" size="small" @click="isShow = false">
          取消
        </el-button>
        <el-button type="primary" size="small" @click="saveMenu">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
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

