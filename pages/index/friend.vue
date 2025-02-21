<script lang="ts" setup>
import { appKeywords } from "@/constants/index";

useSeoMeta({
  title: "好友 - 极物聊天",
  description: "极物聊天 - 极物聊天 开启你的极物之旅！",
  keywords: appKeywords,
});
const chat = useChatStore();
const setting = useSettingStore();
const theFriendOpt = computed({
  get: () => chat.theFriendOpt,
  set: (val) => {
    chat.theFriendOpt = val;
  },
});
const { history, undo, clear } = useRefHistory(theFriendOpt, {
  deep: true,
  capacity: 10,
});
async function clearHistory() {
  chat.showTheFriendPanel = false;
  clear?.();
}
</script>

<template>
  <div class="h-full w-full flex flex-1">
    <div
      class="w-full transition-all sm:(relative mx-auto w-320px border-default-r p-0)"
    >
      <!-- 好友列表 -->
      <ChatFriendTabs class="relative mx-a h-full flex-shrink-0 p-4" />
    </div>
    <div
      class="z-1 h-full flex-1 flex-shrink-0 flex-col card-bg-color-2"
      :class="chat.showTheFriendPanel ? 'flex absolute sm:(p-0 relative) left-0 w-full' : 'hidden sm:flex'"
    >
      <div
        v-if="chat.theFriendOpt.type !== FriendOptType.Empty"
        class="i-solar:alt-arrow-left-line-duotone absolute right-16 top-5 z-1000 hidden p-2.6 sm:block btn-danger"
        title="关闭"
        @click="undo()"
      />
      <div
        v-if="chat.theFriendOpt.type !== FriendOptType.Empty"
        class="i-carbon:close absolute right-4 top-5 z-1000 block scale-110 p-2.6 btn-danger"
        title="关闭"
        @click="clearHistory"
      />
      <!-- 面板 -->
      <ChatFriendMainType
        v-if="chat.theFriendOpt.type !== FriendOptType.Empty"
        key="chat-friend-main-type"
        :data="chat.theFriendOpt"
        class="bg relative z-999 mx-a h-full w-full flex-1 flex-shrink-0"
      />
      <div
        v-else
        key="chat-friend-empty"
        class="flex-row-c-c flex-1 flex-shrink-0 card-bg-color-2"
      >
        <div data-fades class="h-full w-full flex flex-col items-center justify-center text-gray-600 op-80 dark:(text-gray-300 op-50)">
          <i i-solar:users-group-two-rounded-bold-duotone class="mb-2 h-12 w-12" />
          <small>找到你想要聊天的朋友吧 ☕</small>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.main {
  height: 100%;
  width: 100%;
}

.bg {
  // background-image: linear-gradient(160deg, #e8e8fb, #f7f7f7);
  //  background: radial-gradient(63.44% 82.03% at 55.58% -15.63%, #e8e8fb 0%, #b5d1ea80 53.72%, rgba(90, 221, 230, 0)), linear-gradient(26.62deg, rgba(249, 124, 89, 0.1) 20.64%, rgba(249, 124, 89, 0) 49.82%), linear-gradient(56.79deg, #b5d0ea 33.79%, rgba(185, 91, 230, 0) 72.67%), linear-gradient(301.08deg, rgba(252, 178, 91, 0.91) 20.42%, rgba(252, 178, 91, 0) 60.38%), linear-gradient(141.57deg, rgba(78, 173, 235, 0.1) 19.08%, rgba(148, 158, 165, 0) 98.72%, #d3e4ffa9);
  //  background-blend-mode: normal,normal,darken,normal,normal,normal;
  // background-image: linear-gradient(to top, #f3e7e9 0%, #e3eeff 99%, #eff6ff 100%);
  background-image: linear-gradient(160deg, #eaf3ff 0%, transparent, transparent, transparent, transparent, transparent, transparent);
}
.dark .bg {
  background-image: linear-gradient(160deg, #262626 0%, transparent, transparent, transparent, transparent, transparent, transparent, transparent);
}
</style>
