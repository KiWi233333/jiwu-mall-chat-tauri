<script lang="ts" setup>
import { getVersion } from "@tauri-apps/api/app";
import { useModeToggle } from "@/composables/utils/useToggleThemeAnima";
import { appKeywords } from "@/constants/index";

const isLoading = ref(false);
const user = useUserStore();
const setting = useSettingStore();
// 字体监听
watchDebounced(
  () => setting.settingPage.fontFamily.value,
  (val: string) => {
    if (val && document) {
      isLoading.value = true;
      localStorage.setItem("--font-family", val);
      document.documentElement.style.setProperty("--font-family", val);
      setTimeout(() => {
        isLoading.value = false;
      }, 500);
    }
  },
);

const theEvent = ref();
// 夜间模块
watchDebounced(
  () => setting.settingPage.modeToggle.value,
  async (val: string) => {
    if (val && document) {
      if (val)
        useModeToggle(val, theEvent.value);
    }
  },
);
function isColseChange(val: any) {
  if (val)
    document.documentElement.classList.add("stop-transition-all");
  else
    document.documentElement.classList.remove("stop-transition-all");
}

useSeoMeta({
  title: "设置",
  description: "设置 - 极物圈 开启你的极物之旅！",
  keywords: appKeywords,
});
function onSave() {
  ElNotification.success("保存成功！");
}

const theme = computed({
  get: () => setting.settingPage.modeToggle.value,
  set: (val: string) => setting.settingPage.modeToggle.value = val,
});

// 更新
onMounted(async () => {
  const v = await getVersion();
  setting.appUploader.version = v;
});
</script>

<template>
  <div>
    <NuxtLayout name="chat">
      <main v-loading.fullscreen.lock="isLoading" class="my-8 flex flex-1 flex-col p-4 layout-default-se md:p-6">
        <h3 flex items-center>
          账户与安全
          <i i-solar:settings-bold ml-2 inline-block p0.6em opacity-60 hover:animate-spin />
        </h3>
        <ElDivider style="margin: 1.5em 0 1.5em 0;" class="opacity-60" />
        <el-tabs
          model-value="security"
          type="border-card"
          tab-position="top"
          class="flex-1 overflow-hidden rounded-2 bg-transparent"
        >
          <el-tab-pane name="security" style="max-height: 100%;height: 100%;" label="账号" lazy>
            <UserSafeUpdateCards />
          </el-tab-pane>
          <el-tab-pane name="account" label="安全管理" lazy>
            <UserSafeDeviceList />
          </el-tab-pane>
        </el-tabs>
      </main>
    </NuxtLayout>
  </div>
</template>

<style scoped lang="scss">
.inputs {
  --at-apply: 'transition-200 select-none opacity-80 group-hover:opacity-100';
}

:deep(.el-radio-group.inputs) {
  border: 1px solid #7c7c7c33;
  border-radius: 1rem;

  .el-radio-button__inner {
    border: none;
    border-radius: 1rem;
    width: 100%;
  }
}

:deep(.el-select) {
  position: relative;
  z-index: 99;

  .el-input__wrapper {
    border-radius: 1rem;
  }

  .el-popper.el-select__popper {
    border-radius: 1rem;
    overflow: hidden;
  }

  .el-input__inner {
    padding-left: 0.5rem;
  }
}
</style>
