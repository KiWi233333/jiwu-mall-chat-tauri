<script lang="ts" setup>
const setting = useSettingStore();
const user = useUserStore();
const chat = useChatStore();

const isPageReload = ref(false);
function reloadPage() {
  isPageReload.value = true;
  location.reload();
  setTimeout(() => {
    isPageReload.value = false;
  }, 500);
}


// 跳转好友页面
async function toFriendPage() {
  await nextTick();
  await navigateTo("/friend");
  setTimeout(async () => {
    chat.setTheFriendOpt(FriendOptType.Empty);
    const com = document?.getElementById?.("user-search-apply-input");
    if (com) {
      com?.focus();
    }
  }, 200);
}
</script>

<template>
  <el-popover
    placement="bottom-end"
    width="fit-content"
    trigger="click"
    :teleported="true"
    popper-class="!border-default"
    popper-style="padding:0;min-width: 0;"
    transition="popper-fade"
    append-to-body
  >
    <template #reference>
      <slot name="btn">
        <BtnElButton
          text
          size="small"
          title="菜单"
          v-bind="$attrs"
        >
          <i class="i-solar:add-circle-outline hover:i-solar:add-circle-bold" />
        </BtnElButton>
      </slot>
    </template>
    <template #default>
      <div w-fit p-1.5>
        <!-- 发起群聊 -->
        <div class="btn !sm:hidden" @click="() => { chat.showNewGroupDialog = true; }">
          <div
            title="发起群聊"
            class="i-solar:chat-round-dots-outline h-4.5 w-4.5"
          />
          <span ml-2>发起群聊</span>
        </div>
        <!-- 添加好友 -->
        <div class="btn !sm:hidden" @click="toFriendPage">
          <div
            title="添加好友"
            class="i-tabler:user-plus h-4.5 w-4.5"
          />
          <span ml-2>添加好友</span>
        </div>
        <div class="btn" @click="reloadPage">
          <div
            title="刷新页面"
            class="i-solar:refresh-outline h-4.5 w-4.5 transition-transform group-hover:rotate-180"
          />
          <span ml-2>刷新页面</span>
        </div>
        <!-- 切换主题 -->
        <div
          class="btn" @click="(e) => {
            const modes = $colorMode.preference === 'dark' ? 'light' : 'dark';
            useModeToggle(modes, e);
            setting.settingPage.modeToggle.value = modes;
          }"
        >
          <BtnTheme
            id="toggle-theme-btn"
            class="relative z-1 filter-grayscale-100"
            title="切换主题"
          />
          <span ml-2>切换主题</span>
        </div>
        <!-- 退出登录 -->
        <div class="btn" @click="user.exitLogin">
          <i
            class="cursor-pointer"
            title="退出登录"
            plain circle i-solar:logout-3-broken mr-1 p-2
          />
          <span ml-2>退出登录</span>
        </div>
      </div>
    </template>
  </el-popover>
</template>

<style lang="scss" scoped>
.btn {
  --at-apply: "w-8em flex-row-c-c py-1.5 text-sm cursor-pointer hover:card-bg-color-2 card-rounded-df";
}
</style>
