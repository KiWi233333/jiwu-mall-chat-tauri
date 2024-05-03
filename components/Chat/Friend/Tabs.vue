<script lang="ts" setup>
const chat = useChatStore();
const ws = useWs();
function onNewView() {
  chat.setTheFriendOpt(FriendOptType.NewFriend, {});
  // 消费消息
  ws.wsMsgList.applyMsg.splice(0);
}
const activeNames = ref("2");
</script>

<template>
  <div
    class="border-0 border-r-1px transition-200 transition-width border-default"
    v-bind="$attrs"
  >
    <slot name="top">
      <div class="card-item mb-4 border-0 border-b-1px pb-4 border-default">
        <div class="py-2 hover:bg-transparent">
          <ChatFriendApplySearch
            @submit="val => {
              chat.setTheFriendOpt(FriendOptType.User, val)
            }"
          />
        </div>
      </div>
      <div class="card-item">
        <small op-90>新的朋友</small>
        <div class="item" @click="onNewView">
          <el-badge :value="ws.wsMsgList.applyMsg.length || 0" :hidden="!ws.wsMsgList.applyMsg.length" :max="99">
            <div class="avatar-icon bg-[var(--el-color-warning)]">
              <i i-solar:user-plus-bold bg-light p-3 />
            </div>
          </el-badge>
          <small>新的朋友</small>
        </div>
      </div>
    </slot>
    <!-- 群聊 -->
    <el-collapse v-model="activeNames">
      <el-collapse-item name="1" title="群聊">
        <ChatFriendGroupList />
      </el-collapse-item>
      <!-- 好友 -->
      <el-collapse-item name="2" title="好友">
        <ChatFriendList />
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style lang="scss" scoped>
.avatar-icon {
  --at-apply:"h-2.6rem  flex-row-c-c rounded-6px w-2.6rem shadow-sm border-default"
}
.card-item {
  --at-apply:"mb-5 flex flex-col"
}
.item {
  --at-apply:"flex items-center gap-4 p-2 cursor-pointer hover:(bg-[#b8b8b849] ) mt-2 rounded-6px transition-300"
}
</style>
