<script lang="ts" setup>
import { checkUpdate, installUpdate, onUpdaterEvent } from "@tauri-apps/api/updater";
import { relaunch } from "@tauri-apps/api/process";
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
const version = await getVersion();
const isUpdatateLoad = ref(false);
const haveUpdatate = ref(false);
async function checkUpdates() {
  if (isUpdatateLoad.value)
    return;
  isUpdatateLoad.value = true;
  try {
    const update = await checkUpdate();
    console.log("是否有更新", update.shouldUpdate);
    haveUpdatate.value = update.shouldUpdate;
    setTimeout(() => {
      isUpdatateLoad.value = false;
    }, 500);
    if (haveUpdatate.value) {
      ElMessageBox.confirm("检测到新版本，是否更新？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        callback: async (action: string) => {
          if (action === "confirm") {
            await installUpdate();
            await relaunch();
            // const unlisten = await onUpdaterEvent(({ error, status }) => {
            //   // 这将记录所有更新器事件，包括状态更新和错误。
            //   console.log("Updater event", error, status);
            //   isUpdatateLoad.value = false;
            //   ElMessage.info("当前已是最新版本！");
            // });
            // 如果处理程序超出范围，例如组件被卸载，则需要调用 unisten。
            // await unlisten();
          }
        },
      });
    }
    else {
      ElMessage.info("当前已是最新版本！");
    }
  }
  catch (error) {
    setTimeout(() => {
      isUpdatateLoad.value = false;
    }, 500);
  }
}
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
            <el-select v-model="setting.settingPage.fontFamily.value" :teleported="false" :disabled="isLoading" class="inputs w-12rem" placeholder="请选择主题字体">
              <el-option v-for="item in setting.settingPage.fontFamily.list" :key="item.value" :label="item.name" :value="item.value" />
            </el-select>
          </div>
          <!-- 黑暗 -->
          <div class="group flex-row-bt-c">
            深色模式
            <el-radio-group v-model="theme" class="inputs w-12rem" :disabled="isLoading" @click="(e:MouseEvent) => theEvent = e">
              <el-radio-button v-for="p in setting.settingPage.modeToggle.list" :key="p.value" :disabled="isLoading" class="flex-1" :label="p.value">
                {{ p.name }}
              </el-radio-button>
            </el-radio-group>
          </div>
          <!-- 更新 -->
          <div class="group flex-row-bt-c">
            关于更新
            <ElButton round class="flex-row-c-c cursor-pointer v-card" @click="!isUpdatateLoad && checkUpdates()">
              <i i-solar:refresh-outline mr-1 inline-block p-2 op-60 :class="isUpdatateLoad ? 'animate-spin' : ''" />
              <span v-if="version">{{ version }}</span>
            </ElButton>
          </div>
        </section>
        <!-- 保存 -->
        <div class="btns mt-a flex items-center">
          <BtnElButton class="ml-a shadow" icon-class="i-solar:logout-3-outline" type="danger" :transition-icon="true" round @click="user.exitLogin()">
            退出登录
          </BtnElButton>
          <BtnElButton class="ml-a shadow" icon-class="i-solar:diskette-bold" type="info" :transition-icon="true" round @click="onSave">
            保存
          </BtnElButton>
        </div>
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
