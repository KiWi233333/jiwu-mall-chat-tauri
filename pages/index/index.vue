
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
  <!-- 在线人数 -->
  <template v-if="chat.theContact.roomId && chat.theContact.type === RoomType.GROUP ">
    <!-- 移动尺寸 popup -->
    <el-drawer
      v-if="setting.isMobileSize"
      v-model="openRoomDrawer" size="76%" style="box-shadow: none;max-width: 400px;"
      modal-class="backdrop-blur-4px transition-[backdrop-filter] border-default overflow-hidden"
      lock-scroll
      :with-header="false"
    >
      <ChatRoomGroupPopup class="ml-a h-full w-full flex flex-col gap-2 border-r-0 rounded-l-2 rounded-r-0 p-4 border-default-l bg-color" />
    </el-drawer>
    <template v-else>
      <ChatRoomGroupPopup
        v-if="setting.isOpenGroupMember"
        class="ml-a h-full max-w-400px w-1/4 flex flex-col gap-2 border-r-0 rounded-r-0 p-4 border-default-l bg-color"
      />
    </template>
  </template>
</template>

<style lang="scss">
</style>
