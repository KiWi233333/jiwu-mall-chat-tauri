
<script lang="ts" setup>
const chat = useChatStore();
const setting = useSettingStore();

const openRoomDrawer = computed({
  get() {
    return chat.theContact.type === RoomType.GROUP && setting.isOpenGroupMember;
  },
  set(val) {
    if (chat.theContact.type === RoomType.GROUP)
      setting.isOpenGroupMember = val;
  },
});
</script>

<template>
  <div :class="{ 'flex-1 w-full': !chat.theContact.roomId }">
    <!-- 空白 -->
    <div v-if="!chat.theContact.roomId" data-fades class="h-full w-full flex flex-1 flex-col items-center justify-center rounded-0 text-gray-600 border-default-l dark:(text-gray-500)">
      <i i-solar:chat-line-bold-duotone class="mb-2 h-12 w-12" />
      <small>快开始聊天吧 ✨</small>
    </div>
    <!-- 在线人数 -->
    <template v-if="!setting.isMobileSize">
      <ChatRoomGroup v-if="chat.theContact.roomId && chat.theContact.type === RoomType.GROUP && setting.isOpenGroupMember" class="h-full" />
    </template>
    <!-- 移动尺寸 popup -->
    <div v-else-if="chat.theContact.roomId">
      <el-drawer v-model="openRoomDrawer" size="76%" style="box-shadow: none;" modal-class="backdrop-blur-sm transition-[backdrop-filter]" lock-scroll :with-header="false">
        <ChatRoomGroupPopup class="ml-a h-full w-full flex flex-col gap-2 p-4 border-default card-default" />
      </el-drawer>
    </div>
  </div>
</template>

<style lang="scss">
</style>
