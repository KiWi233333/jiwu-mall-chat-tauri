
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
  <ChatContactList
    class="transition-anima absolute left-0 top-0 h-full w-full flex-1 scale-100 sm:(relative w-1/4 flex-none transform-none)"
    :class="{
      '-translate-x-full css-will-change': !chat.isOpenContact,
    }"
  />
  <!-- 聊天框 移动端动画 -->
  <template v-if="chat.theContact.roomId">
    <ChatContent
      class="transition-anima absolute left-0 top-0 z-99 h-full flex-1 sm:(relative w-1/4 transform-none) border-default-l"
      :class="{
        'translate-x-full css-will-change': chat.isOpenContact,
      }"
    />
  </template>
  <!-- 空白 -->
  <div v-else-if="!setting.isMobileSize" data-fades class="h-full w-full flex flex-col items-center justify-center rounded-0 text-gray-600 border-default-l card-default dark:(text-gray-500)">
    <i i-solar:chat-line-bold-duotone class="mb-2 h-12 w-12" />
    <small>快开始聊天吧 ✨</small>
  </div>
  <!-- 在线人数 -->
  <template v-if="chat.theContact.roomId && chat.theContact.type === RoomType.GROUP ">
    <!-- 移动尺寸 popup -->
    <el-drawer
      v-if="setting.isMobileSize"
      v-model="openRoomDrawer" size="76%" style="box-shadow: none;max-width: 300px;"
      modal-class="backdrop-blur-4px transition-[backdrop-filter] border-default overflow-hidden"
      lock-scroll
      :with-header="false"
    >
      <ChatRoomGroupPopup class="ml-a h-full w-full flex flex-col gap-2 border-r-0 rounded-l-2 rounded-r-0 p-4 border-default-l bg-color" />
    </el-drawer>
    <template v-else>
      <ChatRoomGroupPopup
        v-if="setting.isOpenGroupMember"
        class="ml-a h-full max-w-300px w-1/4 flex flex-col gap-2 border-r-0 rounded-r-0 p-4 border-default-l bg-color"
      />
    </template>
  </template>
</template>

<style lang="scss">
.main-box {
  --at-apply: "relative py-4 flex-1  w-full  flex overflow-hidden !p-0 bg-color";
}
.transition-anima {
  transition: transform 0.25s ease-in-out;
}
.css-will-change {
  will-change: transform;
}
</style>
