<script lang="ts" setup>
import type { RoomType } from "@/composables/api/chat/contact";

export interface ChatContactPageDTO {
  type: RoomType
}
const setting = useSettingStore();
</script>

<template>
  <div
    class="group absolute z-4 h-full w-0 flex-shrink-0 overflow-hidden border-0 border-0 rounded-0 transition-300 transition-property-all sm:(relative left-0 top-0 w-1/4 card-default pl-0) bg-color"
    :class="setting.isOpenContact ? (setting.showChatMenu ? 'w-0' : 'pl-4.5rem w-full sm:w-1/4') : ''"
  >
    <ChatContactList class="h-full p-4" />
  </div>
</template>
