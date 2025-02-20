<script lang="ts" setup>
const chat = useChatStore();
const ws = useWsStore();
function toggleView(type: FriendOptType, data: any = {}) {
  chat.setTheFriendOpt(type, data);
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
      <div class="card-item border-0 border-b-1px pb-4 border-default-b">
        <div class="hover:bg-transparent">
          <ChatFriendApplySearch
            @submit="val => chat.setTheFriendOpt(FriendOptType.User, val)"
          />
        </div>
      </div>
    </slot>
    <el-scrollbar height="calc(100% - 3.8rem)" wrap-class="pb-10" class="scrollbar">
      <div class="card-item border-default-2-b">
        <small pb-2 pt-4 op-90>新的朋友</small>
        <div
          class="item"
          :class="{ focus: chat.theFriendOpt.type === FriendOptType.NewFriend }"
          @click="toggleView(FriendOptType.NewFriend)"
        >
          <el-badge :value="ws.wsMsgList.applyMsg.length || 0" :hidden="!ws.wsMsgList.applyMsg.length" :max="99">
            <div class="avatar-icon bg-theme-warning">
              <i i-solar:user-plus-bold bg-light p-3 />
            </div>
          </el-badge>
          <small>新的朋友</small>
        </div>
      </div>
      <div class="card-item">
        <small pb-2 pt-4 op-90>AI 机器人</small>
        <div class="item" :class="{ focus: chat.theFriendOpt.type === FriendOptType.AiRobot }" @click="toggleView(FriendOptType.AiRobot)">
          <el-badge :value="ws.wsMsgList.applyMsg.length || 0" :hidden="!ws.wsMsgList.applyMsg.length" :max="99">
            <div class="avatar-icon bg-theme-primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="ai-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 2c0 .444-.193.843-.5 1.118V5h5a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h5V3.118A1.5 1.5 0 1 1 13.5 2M0 10h2v6H0zm24 0h-2v6h2zM9 14.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3m7.5-1.5a1.5 1.5 0 1 0-3 0a1.5 1.5 0 0 0 3 0" /></svg>
            </div>
          </el-badge>
          <small>探索机器人</small>
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
  --at-apply:"flex flex-col";

  .ai-icon {
    --at-apply: "mx-0.5em pt-2px h-1.4em w-1.4em text-light";
  }
  .item {
    --at-apply: "tracking-1px flex items-center gap-4 p-2 cursor-pointer rounded-6px mb-2 hover:(bg-menu-color) ";
    &.focus {
      --at-apply: "!bg-menu-color";
    }
  }
}
:deep(.el-scrollbar) {
  .el-scrollbar__bar.is-vertical {
    display: none;
  }
}
:deep(.el-collapse) {
  --at-apply: "border-default-t";

  .el-collapse-item__header {
    --at-apply: "h-3em";
  }
  .el-collapse-item__header:not(.is-active) {
    --at-apply: "border-default-b";
  }
  .el-collapse-item__content {
    padding: 0;
  }
  .el-collapse-item__wrap {
    --at-apply: "border-default-b";
  }
}
</style>
