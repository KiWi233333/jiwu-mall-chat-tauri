
<script lang="ts" setup>
import { WsStatusEnum } from "~/types/chat/WsType";

const user = useUserStore();
const ws = useWsStore();
const setting = useSettingStore();
const chat = useChatStore();
const online = useOnline();

const chatRtcCallDialogRef = ref<any>();
const loadingIcon = `
<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M12 4.5a7.5 7.5 0 1 0 0 15a7.5 7.5 0 0 0 0-15M1.5 12C1.5 6.201 6.201 1.5 12 1.5S22.5 6.201 22.5 12S17.799 22.5 12 22.5S1.5 17.799 1.5 12" opacity=".1"/><path fill="currentColor" d="M12 4.5a7.46 7.46 0 0 0-5.187 2.083a1.5 1.5 0 0 1-2.075-2.166A10.46 10.46 0 0 1 12 1.5a1.5 1.5 0 0 1 0 3"/></g></svg>
`;
</script>

<template>
  <main
    v-loading.fullscreen.lock="!user.isLogin"
    class="h-full flex flex-col !overflow-hidden"
    element-loading-text="退出登录中..."
    element-loading-background="transparent"
    :element-loading-spinner="loadingIcon"
  >
    <div
      v-if="user.isLogin"
      class="relative h-full flex flex-col overflow-hidden"
    >
      <MenuHeaderMenuBar>
        <template #drag-content>
          <div
            v-if="ws.status !== WsStatusEnum.OPEN || !user.isLogin"
            class="group relative h-2/3 flex-row-c-c overflow-hidden rounded-8 px-2 text-center sm:px-4"
            w-10em animate-zoom-in-down shadow-md shadow-inset
          >
            <small truncate text-10px tracking-0.1em el-color-danger>
              {{ ws.status !== WsStatusEnum.OPEN ? "会话断开" : (!user.isLogin && !user.getToken) ? "未登录" : '网络错误' }}
              <span v-if="online" class="text-[var(--el-color-danger)]">(无网络)</span>
            </small>
            <div class="absolute h-full w-full flex-row-bt-c scale-80 px-1.5 op-0 transition-all group-hover:(scale-100 op-100) bg-color">
              <BtnElButton
                icon-class="i-solar:refresh-outline mr-1"
                class="hover:shadow-md"
                type="primary"
                round
                size="small"
                style="padding: 0 0.8em;height: 1.8em;line-height: 1.8em;"
                @click="ws.reload()"
              >
                重连
              </BtnElButton>
              <BtnElButton
                icon-class="i-solar:power-bold mr-1"
                class="hover:shadow-md"
                type="danger"
                round
                size="small"
                style="padding: 0 0.8em;height: 1.8em;line-height: 1.8em;"
                @click="navigateTo('/login')"
              >
                登录
              </BtnElButton>
            </div>
          </div>
        </template>
      </MenuHeaderMenuBar>
      <!-- 通话dialog -->
      <ChatRtcCallDialog
        ref="chatRtcCallDialogRef"
        v-model="chat.showRtcCall"
        v-model:call-type="chat.rtcCallType"
      />
      <div
        class="main-box relative"
        v-bind="$attrs"
      >
        <MenuChatMenu class="hidden sm:block" />
        <!-- 会话列表 -->
        <ChatContactList v-show="$route.path === '/'" />
        <!-- 聊天框 -->
        <ChatContent v-show="$route.path === '/'" v-if=" chat.theContact.roomId" class="flex-1 border-default-l" />
        <!-- 缓存内容 -->
        <NuxtPage keepalive />
      </div>
    </div>
    <LazyMenuBottomMenu v-if="user.isLogin && setting.isOpenContact" class="grid sm:hidden" />
  </main>
</template>

<style lang="scss" scoped>
.main-box {
  --at-apply: "mx-a py-4 flex-1 w-full flex overflow-hidden p-0 bg-color";
  padding: 0 !important;
}
</style>
