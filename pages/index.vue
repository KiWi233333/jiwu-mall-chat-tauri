
<script lang="ts" setup>
import { appName } from "~/constants";
import { WsStatusEnum } from "~/types/chat/WsType";

const user = useUserStore();
const ws = useWsStore();
const setting = useSettingStore();
const chat = useChatStore();
const showVideoDialog = ref(false);
const showWsStatusBtns = computed(() => ws.status !== WsStatusEnum.OPEN || !user.isLogin);
const showGroupDialog = computed({
  get() {
    return chat.inviteMemberForm.show;
  },
  set(val) {
    chat.inviteMemberForm = val
      ? {
          ...chat.inviteMemberForm,
          show: true,
        }
      : {
          show: false,
          roomId: undefined,
          uidList: [],
        };
  },
});
// 监听消息
useMsgLinear();
</script>

<template>
  <main
    v-loading.fullscreen.lock="!user.isLogin"
    class="main relative flex flex-col !overflow-hidden"
    element-loading-text="退出登录中..."
    element-loading-background="transparent"
    :element-loading-spinner="defaultLoadingIcon"
  >
    <div
      v-if="user.isLogin"
      class="h-full flex flex-1 flex-col overflow-hidden"
    >
      <MenuHeaderMenuBar class="flex-shrink-0 bg-color">
        <template #center>
          <div v-if="setting.isMobile" class="block tracking-0.1em absolute-center-center sm:hidden" data-tauri-drag-region>
            {{ appName }}
          </div>
          <BtnWsStatusBtns v-if="showWsStatusBtns" class="offline" />
        </template>
      </MenuHeaderMenuBar>
      <div
        class="relative h-1 max-h-full flex flex-1"
      >
        <MenuChatMenu class="hidden w-fit shrink-0 sm:block" />
        <!-- 缓存 页面内容 -->
        <NuxtPage
          keepalive
          :transition="setting.isMobileSize && !setting.settingPage.isCloseAllTransition ? chat.pageTransition : false"
        />
      </div>
    </div>
    <!-- 邀请进群 -->
    <LazyChatNewGroupDialog v-model="showGroupDialog" :form="chat.inviteMemberForm" />
    <!-- 视频播放器 -->
    <LazyUtilVideoPlayerDialog v-model="showVideoDialog" />
    <!-- 扩展菜单 -->
    <LazyMenuExtensionMenu v-model:show="chat.showExtension" />
    <!-- RTC通话弹窗 -->
    <LazyChatRtcCallDialog v-model="chat.showRtcCall" v-model:call-type="chat.rtcCallType" />
    <!-- 移动端菜单 -->
    <LazyMenuBottomMenu v-if="setting.isMobileSize && chat.isOpenContact" class="grid sm:hidden" />
  </main>
</template>

<style lang="scss" scoped>
.main:hover {
  .offline {
    :deep(.btns) {
      --at-apply: "scale-100 op-100";
    }
  }
}
</style>
