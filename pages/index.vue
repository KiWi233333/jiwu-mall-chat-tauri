
<script lang="ts" setup>
import { WsStatusEnum } from "~/types/chat/WsType";

const user = useUserStore();
const ws = useWsStore();
const setting = useSettingStore();
const online = useOnline();
const chat = useChatStore();
</script>

<template>
  <main
    v-loading.fullscreen.lock="!user.isLogin"
    class="relative flex flex-col !overflow-hidden"
    element-loading-text="退出登录中..."
    element-loading-background="transparent"
    :element-loading-spinner="defaultLoadingIcon"
  >
    <div
      v-if="user.isLogin"
      class="h-full flex flex-1 flex-col overflow-hidden"
    >
      <MenuHeaderMenuBar class="flex-shrink-0">
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
      <div
        class="relative h-1 max-h-full flex flex-1"
      >
        <MenuChatMenu class="hidden w-fit shrink-0 sm:block" />
        <!-- 缓存 页面内容 -->
        <NuxtPage keepalive />
      </div>
      <!-- RTC通话弹窗 -->
      <ChatRtcCallDialog v-model="chat.showRtcCall" v-model:call-type="chat.rtcCallType" />
      <LazyMenuBottomMenu v-if="setting.isMobileSize && chat.isOpenContact" class="grid sm:hidden" />
    </div>
  </main>
</template>

<style lang="scss" scoped>
</style>
