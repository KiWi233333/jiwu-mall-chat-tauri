<script lang="ts" setup>
import { getVersion } from "@tauri-apps/api/app";
import { MdPreview } from "md-editor-v3";
import "md-editor-v3/lib/preview.css";
import { open as openFile } from "@tauri-apps/plugin-shell";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
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

const theme = computed({
  get: () => setting.settingPage.modeToggle.value,
  set: (val: string) => setting.settingPage.modeToggle.value = val,
});

// 公告
const showNotice = ref(false);
const notice = ref<string>("# 暂无内容");
const colorMode = useColorMode();

// 更新
onMounted(async () => {
  setting.loadSystemFonts();
  if (setting.isWeb)
    return;

  const v = await getVersion();
  // 公告
  if (v) {
    getVersionNotice(v).then((res) => {
      if (res.code !== StatusCode.SUCCESS)
        ElMessage.closeAll("error");
      if (res.data.notice)
        notice.value = (res.data.notice || "");
    });
  }
  // 检查更新
  setting.appUploader.version = v;
  if (!setting.appUploader.isCheckUpdatateLoad)
    setting.checkUpdates();
});

// 公告
function showVersionNotice(version: string) {
  const v = version.replaceAll("v", "");
  getVersionNotice(v).then((res) => {
    if (res.code !== StatusCode.SUCCESS) {
      ElMessage.closeAll("error");
      ElMessage.warning(res.message);
      return;
    }
    if (res?.data?.notice)
      notice.value = (res.data.notice || "");
    showNotice.value = true;
  });
}

// 更改下载文件夹路径
async function changeDownloadDir() {
  const path = await openDialog({
    multiple: false,
    directory: true,
  });
  if (!path)
    return;
  if (!await existsFile(path)) {
    ElMessage.error("目标路径不存在！");
    return;
  }
  setting.appDataDownloadDirUrl = path;
  ElMessage.success("下载路径已更改！");
}

// 打开下载文件夹
async function openFileFolder() {
  if (!await existsFile(setting.appDataDownloadDirUrl))
    return;
  openFile(setting.appDataDownloadDirUrl);
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
          <div class="group h-8 flex-row-bt-c">
            字体设置
            <el-select
              v-model="setting.settingPage.fontFamily.value"
              allow-create
              style="width: 13rem;" :teleported="false"
              :disabled="isLoading"
              placement="bottom-end"
              class="inputs"
              fit-input-width
              filterable
              default-first-option
              placeholder="请选择主题字体"
            >
              <el-option
                v-for="item in setting.settingPage.fontFamily.list" :key="item.value" :label="item.name"
                :value="item.value"
                :title="item.name"
              />
            </el-select>
          </div>
          <!-- 黑暗 -->
          <div :id="DEFAULT_THEME_TOGGLE_ID" class="group h-8 flex-row-bt-c">
            深色模式
            <el-radio-group
              v-model="theme" class="inputs" :disabled="isLoading"
              @click="(e: MouseEvent) => theEvent = e"
            >
              <el-radio-button
                v-for="p in setting.settingPage.modeToggle.list" :key="p.value" :disabled="isLoading"
                class="flex-1" :value="p.value"
              >
                {{ p.name }}
              </el-radio-button>
            </el-radio-group>
          </div>
          <!-- 关闭动画 -->
          <div class="group h-8 flex-row-bt-c">
            流畅模式
            <el-tooltip
              :content="!setting.settingPage.isColseAllTransition ? '开启动画' : '关闭动画'" placement="left"
              popper-style="padding: 0 0.5em;"
            >
              <el-switch
                v-model="setting.settingPage.isColseAllTransition" size="large" active-text="开启"
                inactive-text="关闭" inline-prompt @change="isColseChange"
              />
            </el-tooltip>
          </div>
          <!-- 上下按键切换会话 -->
          <div class="group h-8 flex-row-bt-c">
            切换会话
            <el-tooltip
              :content="!setting.downUpChangeContact ? '开启方向上下键切换' : '关闭方向上下键切换'" placement="left"
              popper-style="padding: 0 0.5em;"
            >
              <el-switch
                v-model="setting.downUpChangeContact" size="large" active-text="开启"
                inactive-text="关闭" inline-prompt
              />
            </el-tooltip>
          </div>
          <!-- Esc -->
          <div v-if="!setting.isWeb" class="group h-8 flex-row-bt-c">
            ESC关闭
            <el-switch
              v-model="setting.settingPage.isEscMin" size="large" active-text="开启" inactive-text="关闭"
              inline-prompt @change="(val) => setting.settingPage.isEscMin = !!val"
            />
          </div>
          <!-- 自启动 -->
          <div v-if="!setting.isWeb" :id="DEFAULT_THEME_TOGGLE_ID" class="group h-8 flex-row-bt-c">
            开机自启
            <el-switch
              v-model="setting.settingPage.isAutoStart" size="large" active-text="自启"
              inactive-text="关闭" inline-prompt
            />
          </div>
          <!-- 更新 -->
          <div v-if="!setting.isWeb" class="group h-8 flex-row-bt-c">
            关于更新
            <div class="ml-a flex items-center">
              <span v-if="setting.appUploader.version && !setting.appUploader.isUpdating" class="mr-4 cursor-pointer text-0.8rem tracking-0.1em !btn-info" @click="showVersionNotice(setting.appUploader.version)">v{{ setting.appUploader.version }}版本公告</span>
              <el-badge
                v-if="!setting.appUploader.isUpdating"
                :offset="[-5, 5]" :hidden="!setting.appUploader.isUpload"
                is-dot
                :value="+setting.appUploader.isUpload"
              >
                <ElButton
                  round class="flex-row-c-c cursor-pointer transition-all"
                  plain
                  style="height: 2em;padding: 0 0.8em;"
                  :type="setting.appUploader.isUpdating ? 'warning' : 'info'"
                  @click="!setting.appUploader.isCheckUpdatateLoad && setting.checkUpdates(true)"
                >
                  <span flex-row-c-c>
                    <i
                      i-solar:refresh-outline mr-1 inline-block p-2
                      :class="setting.appUploader.isCheckUpdatateLoad ? 'animate-spin' : ''"
                    />
                    检查更新
                  </span>
                </ElButton>
              </el-badge>
              <el-progress
                v-else
                :percentage="+((setting.appUploader.downloaded / setting.appUploader.contentLength) * 100 || 0).toFixed(2)"
                :stroke-width="18"
                striped
                striped-flow
                text-inside
                class="progress-bar w-13rem"
              >
                {{ setting.appUploader.downloadedText || "- / - MB" }}
              </el-progress>
            </div>
          </div>
          <!-- 下载路径 -->
          <div v-if="!setting.isWeb" id="download" class="group h-8 flex-row-bt-c">
            下载
            <div class="ml-a flex items-center" :title="setting.appDataDownloadDirUrl">
              <small class="mr-4 max-w-50vw flex-1 truncate op-60">{{ setting.appDataDownloadDirUrl }}</small>
              <span class="mr-4 cursor-pointer text-0.8rem tracking-0.1em !btn-primary" @click="changeDownloadDir()">更改</span>
              <span class="mr-4 cursor-pointer text-0.8rem tracking-0.1em !btn-info" @click="openFileFolder()">打开目录</span>
            </div>
          </div>
        </section>
        <div class="btns mt-a flex items-center">
          <BtnElButton
            class="ml-a shadow" icon-class="i-solar:trash-bin-trash-outline" :transition-icon="true"
            round
            @click="setting.reset()"
          >
            重置
          </BtnElButton>
          <BtnElButton
            class="shadow" icon-class="i-solar:logout-3-outline" type="danger" :transition-icon="true"
            round @click="user.exitLogin()"
          >
            退出登录
          </BtnElButton>
        </div>
      </main>
      <el-dialog
        v-model="showNotice"
        center
        width="fit-content"
      >
        <template #header>
          <h3>&emsp;版本公告 🔔</h3>
        </template>
        <div class="max-h-60vh min-h-30vh w-90vw overflow-y-auto sm:w-500px">
          <MdPreview
            language="zh-CN"
            editor-id="notice-toast"
            show-code-row-number
            :theme="colorMode.value === 'dark' ? 'dark' : 'light'"
            preview-theme="smart-blue"
            :code-foldable="false"
            code-theme="a11y"
            class="mt-2 text-1em !bg-transparent"
            :model-value="notice"
          />
        </div>
        <div class="mt-2 mt-4 flex-row-c-c">
          <el-button type="primary" @click="showNotice = false">
            &emsp;我知道了 🎉
          </el-button>
        </div>
      </el-dialog>
    </NuxtLayout>
  </div>
</template>

<style scoped lang="scss">
.inputs {
  --at-apply: 'transition-200  select-none';
  --el-border-radius-base: 2em !important;
}

:deep(.el-radio-group.inputs) {
  border: 1px solid #7c7c7c33;
  border-radius: 1rem;
  width: 13rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);

  .el-radio-button__inner {
    border: none;
    border-radius: 1rem;
    width: 100%;
  }

  .el-radio-button__inner {
    padding: 0.5em 0;
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
:deep(.notice-toast-preview-wrapper) {
  .task-list-item-checkbox[type="checkbox"] {
      display: none !important;
  }
}
</style>
