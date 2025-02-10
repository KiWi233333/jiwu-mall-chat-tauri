<script lang="ts" setup>
import { MdPreview } from "md-editor-v3";
import { DEFAULT_RTC_CALL_BELL_URL } from "~/composables/store/useSettingStore";
import { appKeywords, appName } from "~/constants";
import "md-editor-v3/lib/preview.css";


useSeoMeta({
  title: `设置 - ${appName}`,
  description: "极物聊天 - 极物聊天 开启你的极物之旅！",
  keywords: appKeywords,
});

const user = useUserStore();
const setting = useSettingStore();

// 默认
const {
  isFullLoading,
  notificationTypeList,
  changeAnimateMode,
  openFileFolder,
} = useSettingDefault();

// 公告
const {
  showNotice,
  notice,
  currentVersion,
  showUpateNoticeLine,
  showVersionNotice,
  handleCheckUpadate,
  isNoMore,
  versionList,
  loadVersionPage,
  reloadVersionPage,
} = useSettingNotice();

// 主题
const {
  theme,
  themeConfigList,
  thePostion,
} = useSettingTheme();

// 铃声
const {
  audioRaw,
  togglePlayRtcCallBell,
  toggleRtcCallBell,
} = useSettingBell();
</script>

<template>
  <main v-loading.fullscreen.lock="isFullLoading" class="h-full w-full flex flex-1 flex-col p-4 p-6 pt-12 card-bg-color-2">
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
          :disabled="isFullLoading"
          placement="bottom-end"
          class="inputs"
          fit-input-width
          filterable
          default-first-option
          placeholder="请选择主题字体"
        >
          <el-option
            v-for="item in setting.settingPage.fontFamily.list" :key="item.value"
            :value="item.value"
            :label="item.name"
          >
            {{ item.name }}
          </el-option>
        </el-select>
      </div>
      <!-- 黑暗 -->
      <div :id="DEFAULT_THEME_TOGGLE_ID" class="group h-8 flex-row-bt-c">
        深色模式
        <el-segmented
          v-model="theme"
          class="inputs border-default"
          style="width:13rem;background-color: transparent;--el-segmented-item-selected-color: #fff;--el-border-radius-base: 2rem;"
          :options="themeConfigList"
          @click="(e: MouseEvent) => thePostion = { clientX: e.clientX, clientY: e.clientY }"
        />
      </div>
      <!-- 关闭动画 -->
      <div class="group h-8 flex-row-bt-c">
        流畅模式
        <el-tooltip
          :content="!setting.settingPage.isCloseAllTransition ? '开启动画' : '关闭动画'" placement="left"
          popper-style="padding: 0 0.5em;"
        >
          <el-switch
            v-model="setting.settingPage.isCloseAllTransition" size="large" active-text="开启"
            inactive-text="关闭" inline-prompt @change="changeAnimateMode"
          />
        </el-tooltip>
      </div>
      <!-- 上下按键切换会话 -->
      <div v-if="!setting.isMobileSize" class="group h-8 flex-row-bt-c">
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
      <!-- 消息通知 -->
      <div class="group h-8 flex-row-bt-c">
        消息通知
        <el-segmented
          v-model="setting.settingPage.notificationType"
          class="inputs border-default"
          style="width:13rem;background-color: transparent;--el-segmented-item-selected-color: #fff;--el-border-radius-base: 2rem;"
          :options="notificationTypeList"
        />
      </div>
      <!-- Esc -->
      <div v-if="setting.isDesktop" class="group h-8 flex-row-bt-c">
        ESC关闭
        <el-switch
          v-model="setting.settingPage.isEscMin"
          size="large"
          active-text="开启"
          inactive-text="关闭"
          :active-value="true"
          :inactive-value="false"
          inline-prompt @change="(val: string | number | boolean) => setting.settingPage.isEscMin = !!val"
        />
      </div>
      <!-- 自启动 -->
      <div v-if="setting.isDesktop" :id="DEFAULT_THEME_TOGGLE_ID" class="group h-8 flex-row-bt-c">
        开机自启
        <el-switch
          v-model="setting.settingPage.isAutoStart" size="large" active-text="自启"
          inactive-text="关闭" inline-prompt
        />
      </div>
      <!-- 更新 -->
      <div class="group h-8 flex-row-bt-c">
        关于更新
        <div class="ml-a flex items-center gap-2 sm:gap-4">
          <span class="text-0.8rem tracking-0.1em !btn-info" @click="showUpateNoticeLine = true">{{ currentVersion ? `v${currentVersion}` : "" }} 更新日志</span>
          <template v-if="setting.isDesktop">
            <el-badge
              v-if="!setting.appUploader.isUpdating"
              :offset="[-5, 5]" :hidden="!setting.appUploader.isUpload"
              is-dot
              :value="+setting.appUploader.isUpload"
            >
              <ElButton
                v-if="setting.isDesktop"
                class="flex-row-c-c cursor-pointer transition-all"
                round plain
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
          </template>
        </div>
      </div>
      <!-- 通话铃声 -->
      <div id="chat-bell" class="group h-8 flex-row-bt-c">
        通话铃声
        <div class="ml-a flex items-center gap-3" :title="setting.isDefaultRtcCallBell ? '默认铃声' : '自定义铃声'">
          <span
            v-if="!setting.isDefaultRtcCallBell"
            class="cursor-pointer text-0.8rem tracking-0.1em op-0 btn-warning group-hover:op-100"
            @click="setting.settingPage.rtcCallBellUrl = DEFAULT_RTC_CALL_BELL_URL"
          >恢复默认</span>
          <div
            v-show="setting.settingPage.rtcCallBellUrl"
            class="flex-row-c-c cursor-pointer text-sm"
            :class="audioRaw ? 'text-[var(--el-color-danger)] hover:text-[var(--el-color-danger)]' : 'hover:text-[var(--el-color-info)] text-small'"
            @click="togglePlayRtcCallBell(setting.settingPage.rtcCallBellUrl)"
          >
            <i
              class="mr-2 p-2 text-0.8rem tracking-0.1em"
              :class="audioRaw ? 'i-solar:pause-bold' : 'i-solar:play-bold'"
            />
            {{ setting.isDefaultRtcCallBell ? '默认铃声' : '自定义铃声' }}
          </div>
          <span class="cursor-pointer text-0.8rem tracking-0.1em btn-warning" @click="toggleRtcCallBell()">
            {{ setting.settingPage.rtcCallBellUrl ? '更改' : '添加' }}
          </span>
          <!-- 关闭 -->
          <span
            v-if="setting.settingPage.rtcCallBellUrl"
            class="cursor-pointer text-0.8rem tracking-0.1em btn-warning" @click="setting.settingPage.rtcCallBellUrl = ''"
          >
            关闭
          </span>
        </div>
      </div>
      <!-- 下载路径 -->
      <div v-if="!setting.isWeb" id="download" class="group h-8 flex-row-bt-c">
        下载
        <div class="ml-a flex items-center gap-3" :title="setting.appDataDownloadDirUrl">
          <small class="mr-2 max-w-40vw flex-1 truncate op-60">{{ setting.appDataDownloadDirUrl }}</small>
          <span class="cursor-pointer text-0.8rem tracking-0.1em !btn-warning" @click="setting.changeDownloadDir()">更改</span>
          <span class="cursor-pointer text-0.8rem tracking-0.1em !btn-info" @click="openFileFolder()">打开目录</span>
        </div>
      </div>
    </section>
    <div class="btns mt-a flex flex-col items-center gap-4 sm:flex-row">
      <BtnElButton
        class="h-10 w-full rounded-4rem shadow sm:(ml-a h-fit w-fit) !card-bg-color" icon-class="i-solar:trash-bin-trash-outline" :transition-icon="true"
        style="--el-color-primary: var(--el-color-danger);--el-button-hover-border-color: var(--el-color-danger);background-color: inherit;"
        @click="setting.reset()"
      >
        重置
      </BtnElButton>
      <BtnElButton
        class="h-10 w-full rounded-4rem shadow sm:(ml-a h-fit w-fit)" icon-class="i-solar:logout-3-outline" type="danger" :transition-icon="true"
        style="margin-left: 0;"
        @click="user.exitLogin()"
      >
        退出登录
      </BtnElButton>
    </div>
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
          :theme="$colorMode.value === 'dark' ? 'dark' : 'light'"
          preview-theme="smart-blue"
          :code-foldable="false"
          code-theme="a11y"
          class="mt-2 px-4 text-1em !bg-transparent"
          :model-value="notice"
        />
      </div>
      <div class="mt-2 mt-4 flex-row-c-c">
        <el-button type="primary" @click="showNotice = false">
          &emsp;我知道了 🎉
        </el-button>
      </div>
    </el-dialog>
    <!-- 版本的时间线 -->
    <el-dialog
      v-model="showUpateNoticeLine"
      center
      destroy-on-close
      width="fit-content"
    >
      <template #header>
        <h3>
          更新日志
          <i i-solar:notebook-bold ml-2 p-2.5 />
        </h3>
      </template>
      <el-scrollbar wrap-class="w-88vw animate-[blur-in_.6s] overflow-y-auto max-h-40vh min-h-30vh sm:max-h-60vh md:w-420px sm:w-380px max-w-90vw">
        <el-timeline style="max-width: 100%;">
          <ListAutoIncre
            :immediate="true"
            :auto-stop="true"
            :no-more="isNoMore"
            @load="loadVersionPage"
          >
            <el-timeline-item
              v-for="(item, i) in versionList"
              :key="item.notice"
              :color="i === 0 ? 'var(--el-color-primary)' : ''"
              class="group"
            >
              <div class="flex items-center text-xl font-bold">
                v{{ item.version }}
                <el-tag v-if="item.version === currentVersion" type="primary" effect="dark" size="small" class="ml-2 text-xs text-dark">
                  当前
                </el-tag>
                <el-tag v-else-if="item.isLatest" type="danger" effect="dark" size="small" class="ml-2 text-xs text-dark">
                  有新版本
                </el-tag>
                <div class="ml-a mt-2 font-400 text-mini">
                  {{ item.createTime }}
                </div>
              </div>
              <div
                v-if="item.notice"
                class="relative max-h-12em cursor-pointer truncate sm:max-h-16em"
                :class="{ '!max-h-28em': item.isLatest }"
                @click="showVersionNotice(item.version)"
              >
                <MdPreview
                  language="zh-CN"
                  editor-id="notice-toast"
                  show-code-row-number
                  :theme="$colorMode.value === 'dark' ? 'dark' : 'light'"
                  :code-foldable="false"
                  code-theme="a11y"
                  preview-theme="smart-blue"
                  style="font-size: 12px;background-color: transparent;"
                  class="mt-2 card-rounded-df px-4 op-60 shadow-sm shadow-inset transition-opacity hover:op-100 !border-default-hover"
                  :model-value="item.notice.substring(0, 300)"
                />
                <div
                  class="linear-bt absolute bottom-0 left-0 w-full pt-6 text-center hover:text-color-info text-mini"
                >
                  <span op-0 transition-opacity group-hover:op-100>
                    查看更多
                  </span>
                </div>
              </div>
              <div v-else class="text-small">
                暂无更新日志
              </div>
            </el-timeline-item>
            <template #done>
              <div class="py-1rem text-center text-mini">
                {{ versionList.length ? "没有更多了" : "快去认识其他人" }}
              </div>
            </template>
          </ListAutoIncre>
        </el-timeline>
      </el-scrollbar>
      <div class="mt-2 mt-4 flex-row-c-c">
        <BtnElButton class="w-6rem" @click="showUpateNoticeLine = false">
          关&nbsp;闭
        </BtnElButton>
        <BtnElButton
          v-if="setting.isDesktop"
          class="w-6rem"
          type="primary"
          :loading="setting.appUploader.isCheckUpdatateLoad || setting.appUploader.isUpdating"
          @click="handleCheckUpadate"
        >
          {{ setting.appUploader.isUpdating ? '正在更新' : '检查更新' }}
        </BtnElButton>
      </div>
    </el-dialog>
  </main>
</template>

<style scoped lang="scss">
.inputs {
  --btn-nums: 3;
  --at-apply: "transition-200  select-none";
  --el-border-radius-base: 2em !important;
}

:deep(.el-radio-group.inputs) {
  border-radius: 1rem;
  width: 13rem;
  display: flex;

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
:deep(.md-editor-preview-wrapper) {
  padding: 0;
  h1 {
    font-size: 1.6em;
  }
}
:deep(.notice-toast-preview-wrapper) {
  .task-list-item-checkbox[type="checkbox"] {
    display: none !important;
  }
}

.linear-bt {
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 1) 100%);
}
.dark .linear-bt {
  background: linear-gradient(to bottom, rgba(20, 20, 20, 0) 0%, rgba(20, 20, 20, 0.8) 50%, rgba(20, 20, 20, 1) 100%);
}

:deep(.el-timeline-item){
  .el-timeline-item__tail {
    left: 5px;
    top:0.3em;
  }
  .el-timeline-item__node--normal {
    left: 0;
    top: 0.3em;
  }
}
</style>
