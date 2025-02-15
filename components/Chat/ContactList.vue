<script lang="ts" setup>
import type { ChatContactVO } from "@/composables/api/chat/contact";
import { RoomType } from "@/composables/api/chat/contact";
import ContextMenu from "@imengyu/vue3-context-menu";

const props = defineProps<{
  dto?: ContactPageDTO
}>();
const isLoading = ref<boolean>(false);
const setting = useSettingStore();
const user = useUserStore();
const chat = useChatStore();
const isReload = ref(false);
const pageInfo = ref({
  cursor: undefined as undefined | string,
  isLast: false,
  size: 20,
});
const isLoadRoomMap: Record<number, boolean> = {};

// 添加群聊
const showDialog = ref(false);
const ChatNewGroupDialogRef = ref();

// 计算
const theContactId = computed({
  get() {
    return chat.theContactId;
  },
  set(contactId: number) {
    chat.onChangeRoom(contactId);
  },
});

/**
 * 加载会话列表
 */
async function loadData(dto?: ContactPageDTO) {
  if (isLoading.value || pageInfo.value.isLast)
    return;
  isLoading.value = true;
  const { data } = await getChatContactPage({
    pageSize: pageInfo.value.size,
    cursor: pageInfo.value.cursor,
  }, user.getToken);
  if (!data) {
    return;
  }
  if (data && data.list) {
    for (const item of data.list) {
      chat.contactMap[item.roomId] = item;
    }
  }
  pageInfo.value.isLast = data.isLast;
  pageInfo.value.cursor = data.cursor || undefined;
  isLoading.value = false;
  return data.list;
}

// 刷新
async function reload(size: number = 20, dto?: ContactPageDTO, isAll: boolean = true, roomId?: number) {
  if (isReload.value)
    return;
  isReload.value = true;
  if (isAll) {
    chat.contactMap = {};
    pageInfo.value.cursor = undefined;
    pageInfo.value.isLast = false;
    pageInfo.value.size = size;
    if (setting.isMobileSize) { // 移动端
      setting.isOpenGroupMember = false;// 关闭群成员列表
      setting.isOpenContactSearch = true;// 打开搜索框
    }
    const list = await loadData(dto || props.dto);
    // 默认加载首个会话
    if (!setting.isMobileSize && list && list.length && !chat.theContact.roomId) {
      chat.setContact(list[0]);
    }
  }
  else if (roomId) { // 刷新某一房间
    refreshItem(roomId);
  }
  isReload.value = false;
}

// 刷新某一房间
async function refreshItem(roomId: number) {
  if (!roomId || isLoadRoomMap[roomId])
    return;
  isLoadRoomMap[roomId] = true;
  try {
    const item = chat.contactMap[roomId] as ChatContactVO | undefined;
    if (item?.type !== undefined && item.type !== null)
      return;
    if (item?.type === RoomType.GROUP) {
      const res = await getChatContactInfo(roomId, user.getToken, RoomType.GROUP);
      if (res)
        chat.contactMap[roomId] = res.data;
    }
  }
  catch (error) {
    console.log(error);
  }
  finally {
    delete isLoadRoomMap[roomId];
  }
}

// 右键菜单
function onContextMenu(e: MouseEvent, item: ChatContactVO) {
  e.preventDefault();
  const isPin = !!chat.contactMap?.[item.roomId]?.pinTime;
  const opt = {
    x: e.x,
    y: e.y,
    theme: setting.contextMenuTheme,
    items: [
      { // 置顶功能
        customClass: "group",
        icon: isPin ? "i-solar:pin-bold-duotone  group-hover:(i-solar:pin-outline scale-110)" : "i-solar:pin-outline group-hover:i-solar:pin-bold-duotone",
        label: isPin ? "取消置顶" : "置顶",
        onClick: () => {
          chat.setPinContact(item.roomId, isPin ? isTrue.FALESE : isTrue.TRUE);
        },
      },
      {
        customClass: "group",
        divided: "up",
        icon: "i-solar:trash-bin-minimalistic-outline group-btn-danger group-hover:i-solar:trash-bin-minimalistic-bold-duotone",
        label: "不显示聊天",
        onClick: () => {
          chat.deleteContactConfirm(item.roomId, () => {
          });
        },
      },
    ] as any,
  };
  // 群聊
  if (item.type === RoomType.GROUP) {
    // 在第一个后插入
    opt.items.splice(1, 0, {
      customClass: "group",
      icon: "i-solar:user-speak-broken group-btn-warning group-hover:i-solar:user-speak-bold-duotone",
      label: "邀请好友",
      onClick: () => {
        ChatNewGroupDialogRef.value?.reload && ChatNewGroupDialogRef.value?.reload();
        if (ChatNewGroupDialogRef.value?.form) {
          ChatNewGroupDialogRef.value.form.roomId = item.roomId;
          showDialog.value = true;
        }
      },
    });
  }
  else if (item.type === RoomType.SELFT) {
    opt.items.splice(1, 0, {
      customClass: "group",
      icon: "i-solar:user-outline group-btn-info group-hover:i-solar:user-bold-duotone",
      label: "联系TA",
      onClick: () => {
        chat.setTheFriendOpt(FriendOptType.Empty);
        navigateTo("/friend");
      },
    });
  }

  ContextMenu.showContextMenu(opt);
}

// 跳转好友页面
async function toFriendPage() {
  await navigateTo("/friend");
  setTimeout(async () => {
    chat.setTheFriendOpt(FriendOptType.Empty);
    const com = document?.getElementById?.("user-search-apply-input");
    if (com) {
      com?.focus();
    }
  }, 200);
}

function onClickContact(room: ChatContactVO) {
  chat.isOpenContact = false;
  chat.onChangeRoom(room.roomId);
}

reload();

const RoomTypeTagType: Record<number, "" | "primary" | "info" | any> = {
  // [RoomType.GROUP]: "primary",
  // [RoomType.SELFT]: "",
  [RoomType.AICHAT]: "warning",
};
</script>

<template>
  <div
    class="group main"
  >
    <!-- 搜索群聊 -->
    <div
      class="header"
      :class="setting.isMobileSize && !setting.isOpenContactSearch ? '!h-0 overflow-y-hidden' : ''"
    >
      <ElInput
        id="search-contact"
        v-model.lazy="chat.searchKeyWords"
        class="mr-2 text-0.8rem"
        style="height: 2rem;"
        name="search-content"
        type="text"
        clearable
        autocomplete="off"
        :prefix-icon="ElIconSearch"
        minlength="2"
        maxlength="30"
        placeholder="搜索"
      />
      <!-- 添加 -->
      <el-dropdown placement="bottom-end" popper-class="dropdown-btns" trigger="click">
        <div class="icon">
          <i i-carbon:add-large p-2 />
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item :icon="ElIconUser" @click="toFriendPage">
              添加好友
            </el-dropdown-item>
            <!-- divided -->
            <el-dropdown-item divided :icon="ElIconPlus" @click="showDialog = true">
              新建群聊
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <!-- 会话列表 -->
    <el-scrollbar wrap-class="w-full h-full" class="contact-list" wrapper-class="relative">
      <!-- 添加骨架屏 -->
      <div v-if="isReload" class="animate-(fade-in duration-120) overflow-y-auto">
        <ChatContactSkeleton v-for="i in 10" :key="i" />
      </div>
      <ListAutoIncre
        :immediate="true"
        :auto-stop="false"
        loading-class="op-0"
        :no-more="pageInfo.isLast"
        @load="loadData(dto)"
      >
        <ListTransitionGroup :immediate="false">
          <div
            v-for="room in chat.getContactList"
            :key="room.roomId"
            class="contact"
            :class="{
              'is-pin': room.pinTime,
              'is-checked': room.roomId === theContactId,
            }"
            @contextmenu.stop="onContextMenu($event, room)"
            @click="onClickContact(room)"
          >
            <el-badge
              :hidden="!room.unreadCount" :max="99" :value="room.unreadCount"
              class="h-3em w-3em flex-shrink-0"
            >
              <CardElImage
                :default-src="room.avatar" fit="cover"
                class="h-full w-full object-cover shadow-sm card-default"
              />
            </el-badge>
            <div class="flex flex-1 flex-col justify-between truncate">
              <div flex truncate>
                <p class="text truncate text-black dark:text-white">
                  {{ room.name }}
                </p>
                <!-- AI机器人 -->
                <svg
                  v-if="RoomTypeTagType[room.type]" xmlns="http://www.w3.org/2000/svg" class="ai-icon" viewBox="0 0 24 24"
                ><path fill="currentColor" d="M13.5 2c0 .444-.193.843-.5 1.118V5h5a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h5V3.118A1.5 1.5 0 1 1 13.5 2M6 7a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1zm-4 3H0v6h2zm20 0h2v6h-2zM9 14.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3m6 0a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3" /></svg>
                <span class="text ml-a w-fit flex-shrink-0 text-right text-0.7em leading-2em text-mini">
                  {{ formatContactDate(room.activeTime) }}
                </span>
              </div>
              <p class="text mt-1 flex text-small">
                <small
                  class="h-1.5em flex-1 truncate"
                  :class="{ 'text-[var(--el-color-info)] font-600': room.unreadCount }"
                >
                  {{ room.text }}
                </small>
                <small v-if="room.pinTime" class="text ml-a flex-shrink-0 text-dark dark:text-light-500">
                  &nbsp;置顶
                </small>
              </p>
            </div>
          </div>
        </ListTransitionGroup>
        <template #done>
          <!-- <div class="my-4 w-full text-center text-mini">
             {{ pageInfo.isLast ? '没有更多了' : '' }}
          </div> -->
        </template>
      </ListAutoIncre>
    </el-scrollbar>
    <!-- 新建群聊 -->
    <LazyChatNewGroupDialog ref="ChatNewGroupDialogRef" v-model="showDialog" />
  </div>
</template>

<style lang="scss" scoped>
.main {
  --at-apply: "z-4 h-full flex flex-shrink-0 flex-col select-none overflow-hidden border-0 border-0 rounded-0 sm:(relative left-0 top-0 w-1/4 pl-0 card-bg-color-2) bg-color-3";
}
.contact-list {
  --at-apply: "sm:p-2 p-0";

  .contact {
    --at-apply: "border-(1px solid transparent) flex items-center gap-3 p-3 sm:(w-full text-color card-rounded-df mb-2) card-bg-color  w-full text-sm  cursor-pointer  !hover:bg-[#f8f8f8] !dark:hover:bg-[#151515]";
    .text {
      --at-apply: "transition-none";
    }

    .ai-icon {
      --at-apply: "mx-0.5em pt-2px h-1.4em w-1.4em text-theme-primary dark:text-theme-info";
    }
    &.is-pin {
      --at-apply: "sm:border-default";
    }
    &.is-checked {
      --at-apply: "!sm:(bg-[var(--el-color-primary)] color-white dark:text-light  dark:bg-[var(--el-color-primary-light-3)] hover:op-90)  ";
      .text {
        --at-apply: "sm:(color-white dark:text-light)";
      }
      .ai-icon {
        --at-apply: "sm:!text-light";
      }
    }
  }
}

.header {
  --at-apply: "sm:(h-16 px-4) h-14 px-3 flex-row-c-c flex-shrink-0 transition-200 transition-height  card-bg-color";
  :deep(.el-input) {
    .el-input__wrapper {
      --at-apply: "!shadow-none !outline-none bg-color-2 dark:bg-dark-7";
    }
  }
  .icon {
    --at-apply: "h-2rem w-2rem flex-row-c-c btn-primary-bg  bg-color-2 dark:bg-dark-7";
  }
}

:deep(.el-scrollbar__bar) {
  opacity: 0.4;
}
</style>
