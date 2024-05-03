<script lang="ts" setup>
import { appKeywords } from "@/constants/index";

definePageMeta({
  key: route => route.fullPath,
  layout: false,
});

useSeoMeta({
  title: "极物聊天 - 极物圈 👑",
  description: "极物聊天 - 极物圈 开启你的极物之旅！",
  keywords: appKeywords,
});
const chat = useChatStore();
const setting = useSettingStore();
</script>

<template>
  <div>
    <NuxtLayout
      name="chat"
    >
      <div class="relative flex flex-1">
        <!-- 好友列表 -->
        <div
          class="w-full transition-all sm:(relative mx-auto w-1/4 p-0) card-default"
        >
          <ChatFriendTabs class="relative mx-a h-full flex-shrink-0 p-4" />
        </div>
        <div
          class="z-1 h-full flex-1 flex-shrink-0 flex-col sm:w-3/4 card-default"
          :class="chat.showTheFriendPanel ? 'flex absolute sm:(p-0 relative) left-0 w-full' : 'hidden sm:flex'"
        >
          <btn-el-button
            icon-class="i-solar:power-bold"
            transition-icon
            size="small"
            class="absolute right-1rem top-1rem z-2 block sm:hidden"
            @click="chat.showTheFriendPanel = false"
          >
            关闭
          </btn-el-button>
          <!-- 面板 -->
          <ChatFriendMainType
            v-if="chat.theFriendOpt.type !== FriendOptType.Empty"
            :data="chat.theFriendOpt"
            class="mx-a h-full w-full flex-1 flex-shrink-0 bg-color"
          />
          <div
            v-else
            class="flex-row-c-c flex-1 flex-shrink-0 bg-color"
          >
            <ElEmpty
              mt-10
              :image-size="80"
              description="找到你想要聊天的朋友吧"
            >
              <template #image>
                <i i-solar:users-group-two-rounded-bold-duotone p-2rem op-40 />
              </template>
            </ElEmpty>
          </div>
        </div>
      </div>
    </NuxtLayout>
  </div>
</template>


<style scoped lang="scss">
.main {
  height: 100%;
  width: 100%;
}
</style>
