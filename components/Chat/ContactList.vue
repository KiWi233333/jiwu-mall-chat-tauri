<script lang="ts" setup>
import { type ChatContactVO, RoomType } from "@/composables/api/chat/contact";
import ContextMenu from "@imengyu/vue3-context-menu";
import { WSMemberStatusEnum } from "~/composables/types/WsType";

const props = defineProps<{
  dto?: ContactPageDTO
}>();
const [autoAnimateRef, enable] = useAutoAnimate();
const isLoading = ref<boolean>(false);
const user = useUserStore();
const chat = useChatStore();
const pageInfo = ref({
  cursor: null as null | string,
  isLast: false,
  size: 20,
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
    data.list.forEach((p: ChatContactVO) => {
      chat.contactMap[p.roomId] = p;
    });
  }
  pageInfo.value.isLast = data.isLast;
  pageInfo.value.cursor = data.cursor;
  isLoading.value = false;
  return data.list;
}
const setting = useSettingStore();
const nowDate = Date.now();
function getTime(time: string | number) {
  return (nowDate - +time) > 24 * 3600
    ? useDateFormat(time, "YYYY-MM-DD").value.toString()
    : useDateFormat(time, "HH:mm:ss").value.toString()
  ;
}
// 会话store
const contact = useChatStore();
// 改变当前会话
const theContactId = computed({
  get() {
    return contact.theContact.roomId;
  },
  set(contactId: number) {
    onChangeRoom(contactId);
  },
});
// 切换房间
async function onChangeRoom(newRoomId?: number) {
  if (!newRoomId)
    return;
  const item = chat.contactMap[newRoomId];
  if (!item)
    return;
  if (item.type === RoomType.SELFT)
    contact.setContact(item);
  try {
    const res = await getChatContactInfo(newRoomId, user.getToken, item?.type);
    if (res && res.code === StatusCode.SUCCESS) {
      contact.setContact(res?.data);
      if (item) {
        item.roomGroup = res?.data?.roomGroup;
        item.member = res?.data?.member;
      }
    }
    else {
      contact.setContact(chat.contactList[0] || {} as ChatContactVO);
    }
  }
  catch (error) {
    console.log(error);
  }
  setting.isOpenContact = false;
}
chat.onChangeRoom = onChangeRoom;
const isReload = ref(false);
// 刷新
async function reload(size: number = 20, dto?: ContactPageDTO, isAll: boolean = true, roomId?: number) {
  if (isReload.value)
    return;
  isReload.value = true;
  if (isAll) {
    enable(false);// 首次不开启动画
    chat.contactMap = {};
    pageInfo.value.cursor = null;
    pageInfo.value.isLast = false;
    pageInfo.value.size = size;
    if (setting.isMobileSize) { // 移动端
      setting.isOpenContact = true;// 打开会话列表
      setting.isOpenGroupMember = false;// 关闭群成员列表
      setting.isOpenContactSearch = true;// 打开搜索框
    }
    await loadData(dto || props.dto);
    await nextTick();
    enable(!setting.settingPage.isCloseAllTransition);
    // if (setting.isMobileSize) { // 默认选中第一个
    //   if (chat.contactList?.[0]?.roomId) {
    //     theContactId.value = chat.contactList[0].roomId;
    //   }
    // }
  }
  else if (roomId) { // 刷新某一房间
    refreshItem(roomId);
  }
  isReload.value = false;
}

const isLoadRoomMap: Record<number, boolean> = {};
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
contact.onReloadContact = reload;

// 添加群聊
const showDialog = ref(false);
const ChatNewGroupDialogRef = ref();

// 右键菜单
const colorMode = useColorMode();
function onContextMenu(e: MouseEvent, item: ChatContactVO) {
  e.preventDefault();
  const opt = {
    x: e.x,
    y: e.y,
    theme: colorMode.preference === "dark" ? "mac dark" : "wind10",
    items: [
    ] as any,
  };
  // 群聊
  if (item.type === RoomType.GROUP) {
    // 是否群主
    opt.items = [
      {
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
      },
      {
        icon: "i-solar:logout-3-broken group-btn-error group-hover:i-solar:logout-3-bold-duotone",
        label: "退出群聊",
        customClass: "group",
        onClick: () => {
          ElMessageBox.confirm("是否退出该群聊？", {
            confirmButtonText: "退出",
            cancelButtonText: "取消",
            center: true,
            title: "提醒",
            lockScroll: false,
            type: "warning",
            callback: async (action: string) => {
              if (action === "confirm") {
                const res = await exitRoomGroup(item.roomId, user.getToken);
                if (res.code === StatusCode.SUCCESS) {
                  ElNotification.success("退出成功！");
                  if (chat.theContact.roomId === item.roomId)
                    chat.setContact();
                  chat.removeContact(item.roomId);
                }
              }
            },
          });
        },

      },
    ];
  }
  else if (item.type === RoomType.SELFT) {
    opt.items = [
      {
        customClass: "group",
        icon: "i-solar:user-outline group-btn-info group-hover:i-solar:user-bold-duotone",
        label: "联系TA",
        onClick: () => {
          chat.setTheFriendOpt(FriendOptType.Empty);
          navigateTo("/friend");
        },
      },
    ];
  }

  ContextMenu.showContextMenu(opt);
}

const ws = useWs();
// 成员变动消息
const stopWatch = watchDebounced(() => ws.wsMsgList.memberMsg.length, async (len: number) => {
  if (!len)
    return;
  // 成员变动消息
  if (ws.wsMsgList.memberMsg.length) {
    for (const p of ws.wsMsgList.memberMsg) {
      // 新加入
      if (p.changeType === WSMemberStatusEnum.JOIN) {
        getChatContactInfo(p.roomId, user.getToken, RoomType.GROUP)?.then((res) => {
          if (res) {
            const item = chat.contactMap[p.roomId];
            if (item) { // 更新
              chat.contactMap[p.roomId] = res.data;
            }
            else { // 添加
              res.data.unreadCount = 1;
              chat.contactMap[res.data.roomId] = res.data;
              // unshift();
            }
          }
        }).finally(() => {
        });
        // 更新用户列表
        if (!p.uid)
          return;
        getCommUserInfoSe(p.uid, user.getToken).then((res) => {
          if (res.code === StatusCode.SUCCESS) {
            chat.onOfflineList.push({
              userId: p.uid,
              avatar: res.data.avatar,
              nickName: res.data.nickname,
              activeStatus: 0,
              lastOptTime: res.data.lastLoginTime,
              roleType: ChatRoomRoleEnum.MEMBER,
            });
          }
        });
      }
      else if (p.changeType === WSMemberStatusEnum.LEAVE) {
        for (let i = 0; i < chat.onOfflineList.length; i++) {
          const u = chat.onOfflineList[i];
          // 下线删除用户
          if (u && u.userId === p.uid) {
            chat.onOfflineList.splice(i, 1);
            break;
          }
        }
      }
      else if (p.changeType === WSMemberStatusEnum.DEL) {
        // 删除会话
        chat.removeContact(p.roomId);
      }
    }
    ws.wsMsgList.memberMsg.splice(0);
  }
}, {
  immediate: false,
});

// 初始化
reload();
onMounted(() => {
  enable(false);
});
onBeforeUnmount(() => {
  stopWatch?.();
});
</script>

<template>
  <div
    class="group absolute z-4 h-full w-0 flex flex-shrink-0 flex-col overflow-hidden border-0 border-0 rounded-0 bg-white sm:(relative left-0 top-0 max-w-360px w-1/4 pl-0) dark:bg-dark-7"
    :class="setting.isOpenContact ? (setting.showChatMenu ? 'w-full sm:w-1/4' : 'hidden') : ''"
  >
    <!-- 搜索群聊 -->
    <div
      class="trnasition-200 h-18 flex-row-c-c px-4 transition-height"
      :class="setting.isMobileSize && !setting.isOpenContactSearch ? '!h-0 overflow-y-hidden' : ''"
    >
      <ElInput
        id="search-contact"
        v-model.lazy="chat.searchKeyWords"
        class="mr-2"
        type="text"
        clearable
        autocomplete="off"
        :prefix-icon="ElIconSearch"
        minlength="2"
        maxlength="30"
        placeholder="搜索好友群聊"
      />
      <BtnElButton
        plain
        style="width: 2rem;transition: 200ms;"
        @click="showDialog = true"
      >
        <i i-carbon:add-large p-2 />
      </BtnElButton>
    </div>

    <!-- 桌面端是否登录 -->
    <!-- <small sticky left-0 top-0 p4 sm:hidden border-default-b>
      当前聊天
    </small> -->
    <!-- 会话列表 -->
    <el-scrollbar wrap-class="w-full h-full" class="contact-list">
      <el-radio-group v-model="theContactId" class="w-full">
        <ListAutoIncre
          :immediate="true"
          :auto-stop="false"
          loading-class="op-0"
          :no-more="pageInfo.isLast"
          @load="loadData(dto)"
        >
          <div ref="autoAnimateRef" class="relative w-full flex flex-col">
            <el-radio
              v-for="room in chat.getContactList"
              :key="room.roomId"
              aria-selected="true"
              style="border-radius: 0;"
              :value="room.roomId"
              @click="() => {
                if (theContactId === room.roomId) {
                  setting.isOpenContact = false;
                }
              }"
            >
              <div
                :class="{ 'shadow-inset': room.roomId === theContactId }"
                class="flex gap-4 truncate px-4 py-3 transition-200 transition-shadow sm:(w-full p-4 px-5) hover:bg-[#7c7c7c1a] text-color"
                @contextmenu.stop="onContextMenu($event, room)"
              >
                <el-badge :hidden="!room.unreadCount" :max="99" :value="room.unreadCount" class="h-2.6rem w-2.6rem flex-shrink-0">
                  <CardElImage :src="BaseUrlImg + room.avatar" fit="cover" class="h-2.6rem w-2.6rem object-cover card-default" />
                </el-badge>
                <div class="flex flex-1 flex-col justify-between truncate">
                  <div flex truncate>
                    <p truncate>
                      {{ room.name }}
                    </p>
                    <span ml-a mt-a hidden w-7em flex-shrink-0 truncate text-right text-0.7em op-35 sm:block>
                      {{ getTime(room.activeTime) }}
                    </span>
                  </div>
                  <small
                    overflow-hidden truncate op-70 :class="{ 'text-[var(--el-color-info)] font-600': room.unreadCount }"
                  >{{ room.text }}</small>
                </div>
              </div>
            </el-radio>
          </div>
          <template #done>
            <div
              class="mb-6 w-full text-center text-0.8rem opacity-60"
            >
              暂无更多
            </div>
          </template>
        </ListAutoIncre>
      </el-radio-group>
    </el-scrollbar>
    <!-- 新建群聊 -->
    <LazyChatNewGroupDialog ref="ChatNewGroupDialogRef" v-model="showDialog" />
  </div>
</template>

<style lang="scss" scoped>
.contact-list {

  :deep(.el-radio-group) {
    display: block;
    padding: 0;
    font-size: 1rem;
    margin: 0;
    width: 100%;
  }
  :deep(.el-radio){
    width: 100%;
    height: fit-content;
    display: block;
    padding: 0;
    border: none;
    transition: 200ms border;
    margin: 0;
    margin-bottom: 0.5rem;
    &.is-checked {
      .group {
        background-color: var(--el-color-primary-light-9);
      }
      background-color: #7c7c7c1a;
    }
    .el-radio__input {
      display: none;
      border-color: transparent;
    }
    .el-radio__label {
      padding: 0;
    }
  }
}

:deep(.el-scrollbar__bar) {
  opacity: 0.4;
}
</style>
