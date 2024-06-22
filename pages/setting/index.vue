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
          系统设置
          <i i-solar:settings-bold ml-2 inline-block p0.6em opacity-60 hover:animate-spin />
        </h3>
        <ElDivider class="opacity-60" />
        <section text-0.9rem grid="~ cols-1 gap-4">
          <!-- 字体 -->
          <div class="group flex-row-bt-c">
            字体设置
            <el-select v-model="setting.settingPage.fontFamily.value" style="width: 176px;" :teleported="false" :disabled="isLoading" class="inputs w-12rem" placeholder="请选择主题字体">
              <el-option v-for="item in setting.settingPage.fontFamily.list" :key="item.value" :label="item.name" :value="item.value" />
            </el-select>
          </div>
          <!-- 黑暗 -->
          <div class="group flex-row-bt-c">
            深色模式
            <el-radio-group v-model="theme" class="inputs" :disabled="isLoading" @click="(e:MouseEvent) => theEvent = e">
              <el-radio-button v-for="p in setting.settingPage.modeToggle.list" :key="p.value" :disabled="isLoading" class="flex-1" :value="p.value">
                {{ p.name }}
              </el-radio-button>
            </el-radio-group>
          </div>
          <!-- 关闭动画 -->
          <div class="group flex-row-bt-c">
            流畅模式
            <el-tooltip :content="setting.settingPage.isColseAllTransition ? '开启动画' : '关闭动画'" placement="bottom">
              <el-switch
                v-model="setting.settingPage.isColseAllTransition"
                class="mb-2"
                active-text="开启"
                inactive-text="关闭"
                inline-prompt
                size="large"
                @change="isColseChange"
              />
            </el-tooltip>
          </div>
          <!-- 更新 -->
          <div class="group flex-row-bt-c">
            关于更新
            <ElTooltip :content="setting.appUploader.version">
              <el-badge :hidden="!setting.appUploader.isUpload" is-dot :value="+setting.appUploader.isUpload">
                <ElButton round class="flex-row-c-c cursor-pointer transition-all" type="info" plain style="height: 2.2em" @click="!setting.appUploader.isUpdatateLoad && setting.checkUpdates()">
                  <i i-solar:refresh-outline mr-1 inline-block p-2 :class="setting.appUploader.isUpdatateLoad ? 'animate-spin' : ''" />
                  <span>检查更新</span>
                </ElButton>
              </el-badge>
            </ElTooltip>
          </div>
        </section>
        <div class="btns mt-a flex items-center">
          <BtnElButton class="ml-a shadow" icon-class="i-solar:logout-3-outline" type="danger" :transition-icon="true" round @click="user.exitLogin()">
            退出登录
          </BtnElButton>
        </div>
      </main>
    </NuxtLayout>
  </div>
</template>

<style scoped lang="scss">
.inputs {
  --at-apply: 'transition-200  select-none opacity-80 group-hover:opacity-100';
  --el-border-radius-base: 2em !important;
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
