<script lang="ts" setup>
const chat = useChatStore();
const setting = useSettingStore();
// 获取类型
const getType = computed(() => {
  let msg = "";
  switch (chat?.theContact?.type) {
    case RoomType.GROUP:
      msg = "群";
      break;
    case RoomType.SELFT:
      msg = "私";
      break;
    case RoomType.AICHAT:
      msg = "AI";
      break;
  }
  return msg;
});
</script>

<template>
  <div class="h-16 flex-row-bt-c rounded-0 pl-2 pr-4 sm:(h-16 pl-4)">
    <div w-full flex items-center gap-3>
      <CardElImage
        loading="lazy"
        :preview-src-list="[BaseUrlImg + chat.theContact.avatar]"
        :alt="chat.theContact.name"
        :src="BaseUrlImg + chat.theContact.avatar"
        class="h-2.2em w-2.2em flex-shrink-0 object-cover sm:(h-2.4em w-2.4em) border-default card-default"
      />
      <span truncate text-sm font-500>
        {{ chat.theContact.name }}
      </span>
      <el-tag effect="dark" size="small">
        {{ getType }}
      </el-tag>
      <i
        v-if="chat.theContact.type === RoomType.GROUP"
        class="ml-a flex-row-c-c grid-gap-2 btn-primary"
        transition="all  op-60 group-hover:op-100 300  cubic-bezier(0.61, 0.225, 0.195, 1.3)"
        i-solar:menu-dots-bold
        p-2.2 @click="setting.isOpenGroupMember = !setting.isOpenGroupMember"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
</style>
