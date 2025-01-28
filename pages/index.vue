
<script lang="ts" setup>
import { WsStatusEnum } from "~/types/chat/WsType";

const user = useUserStore();
const ws = useWsStore();
const setting = useSettingStore();
const chat = useChatStore();
const online = useOnline();

onMounted(() => {
  setting.isOpenContact = true;
});
</script>

<template>
  <main
    v-loading.fullscreen.lock="!user.isLogin"
    class="h-full flex flex-col !overflow-hidden"
    element-loading-text="退出登录中..."
    element-loading-background="transparent"
    :element-loading-spinner="defaultLoadingIcon"
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
      <div
        class="main-box"
        v-bind="$attrs"
      >
        <MenuChatMenu class="hidden sm:block" />
        <ChatContactList
          class="transition-anima absolute left-0 top-0 h-full w-full flex-1 scale-100 sm:(relative left-0 top-0 w-1/4 flex-none transform-none)"
          :class="{
            '-left-100vw css-will-change': !setting.isOpenContact,
            '!hidden': $route.path !== '/',
          }"
        />
        <!-- 聊天框 移动端动画 -->
        <ChatContent
          v-if="chat.theContact.roomId"
          class="transition-anima absolute left-0 top-0 z-99 h-full flex-1 sm:(relative left-0 top-0 w-1/4 transform-none) border-default-l"
          :class="{
            'left-100vw css-will-change': setting.isOpenContact,
            '!hidden': $route.path !== '/',
          }"
        />
        <!-- 空白 -->
        <div v-else data-fades class="h-full w-full flex flex-col items-center justify-center rounded-0 text-gray-600 border-default-l card-default dark:(text-gray-500)">
          <i i-solar:chat-line-bold-duotone class="mb-2 h-12 w-12" />
          <small>快开始聊天吧 ✨</small>
        </div>
        <!-- 缓存 页面内容 -->
        <NuxtPage keepalive />
      </div>
    </div>
    <LazyMenuBottomMenu v-if="setting.isMobileSize && setting.isOpenContact" class="grid sm:hidden" />
  </main>
</template>

<style lang="scss" scoped>
.main-box {
  --at-apply: "relative py-4 flex-1  w-full  flex overflow-hidden !p-0 bg-color";
}
.transition-anima {
  transition: left 0.25s ease-in-out;
}
// .css-will-change {
  // will-change: left;
// }
</style>
