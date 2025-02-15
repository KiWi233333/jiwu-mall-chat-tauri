<script lang="ts" setup>
const chat = useChatStore();
const ws = useWsStore();
function onNewView() {
  chat.setTheFriendOpt(FriendOptType.NewFriend, {});
  // 消费消息
  ws.wsMsgList.applyMsg.splice(0);
}
const route = useRoute();
const activeNames = useLocalStorage(`${route.fullPath}_activeNames`, {
  arr: ["2"],
});
</script>

<template>
  <div
    class="border-0 transition-200 transition-width"
    v-bind="$attrs"
  >
    <slot name="top">
      <div class="card-item mb-4 border-0 border-b-1px pb-4 border-default-b">
        <div class="hover:bg-transparent">
          <ChatFriendApplySearch
            @submit="val => {
              chat.setTheFriendOpt(FriendOptType.User, val)
            }"
          />
        </div>
      </div>
    </slot>
    <el-scrollbar height="calc(100% - 3.8rem)" wrap-class="pb-10" class="scrollbar">
      <div class="card-item">
        <small op-90>新的朋友</small>
        <div class="item mt-4" @click="onNewView">
          <el-badge :value="ws.wsMsgList.applyMsg.length || 0" :hidden="!ws.wsMsgList.applyMsg.length" :max="99">
            <div class="avatar-icon bg-[var(--el-color-warning)]">
              <i i-solar:user-plus-bold bg-light p-3 />
            </div>
          </el-badge>
          <small>新的朋友</small>
        </div>
      </div>
      <el-collapse v-model="activeNames.arr">
        <!-- 群聊 -->
        <el-collapse-item name="1" title="群聊">
          <ChatFriendGroupList type="group" />
        </el-collapse-item>
        <!-- 好友 -->
        <el-collapse-item name="2" title="好友">
          <ChatFriendGroupList type="friend" />
        </el-collapse-item>
      </el-collapse>
    </el-scrollbar>
  </div>
</template>

<style lang="scss" scoped>
.avatar-icon {
  --at-apply:"h-2.4rem  flex-row-c-c rounded-6px w-2.4rem shadow-sm border-default"
}
.card-item {
  --at-apply:"mb-5 flex flex-col"
}
.item {
  --at-apply: "flex items-center gap-4 p-2 cursor-pointer rounded-6px mt-2 hover:(bg-menu-color) ";
  &.focus {
    --at-apply: "bg-menu-color";
  }
}
:deep(.el-scrollbar) {
  .el-scrollbar__bar.is-vertical {
    display: none;
  }
}
:deep(.el-collapse) {
  .el-collapse-item__header:not(.is-active) {
    --at-apply: "border-default-b";
  }
  .el-collapse-item__wrap {
    --at-apply: "border-default-b";
  }
}
</style>
