
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
  <!-- 空白 -->
  <div v-if="!chat.theContact.roomId" data-fades class="h-full w-full flex flex-col items-center justify-center rounded-0 text-gray-600 border-default-l card-default dark:(text-gray-500)">
    <i i-solar:chat-line-bold-duotone class="mb-2 h-12 w-12" />
    <small>快开始聊天吧 ✨</small>
  </div>
  <!-- 在线人数 -->
  <template v-if="chat.theContact.roomId && chat.theContact.type === RoomType.GROUP ">
    <!-- 移动尺寸 popup -->
    <el-drawer
      v-if="setting.isMobileSize"
      v-model="openRoomDrawer" size="76%" style="box-shadow: none;"
      modal-class="backdrop-blur-4px transition-[backdrop-filter] border-default overflow-hidden"
      lock-scroll
      :with-header="false"
    >
      <ChatRoomGroupPopup class="ml-a h-full w-full flex flex-col gap-2 border-r-0 rounded-l-2 rounded-r-0 p-4 border-default-l bg-color" />
    </el-drawer>
    <template v-else>
      <ChatRoomGroupPopup
        v-if="setting.isOpenGroupMember"
        class="ml-a h-full w-22vw flex flex-col gap-2 border-r-0 rounded-r-0 p-4 border-default-l bg-color"
      />
    </template>
  </template>
</template>

<style lang="scss">
</style>
