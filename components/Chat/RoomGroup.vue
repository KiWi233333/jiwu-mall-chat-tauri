<script lang="ts" setup>
import ContextMenu from "@imengyu/vue3-context-menu";
import { type ChatRoomAdminAddDTO, ChatRoomRoleEnum, ChatRoomRoleEnumMap } from "~/composables/api/chat/room";
import type { WSOnlineOfflineNotify } from "~/composables/types/WsType";

const chatRoomRoleEnumMap = ChatRoomRoleEnumMap;
const ws = useWs();
const chat = useChatStore();
const setting = useSettingStore();
const isLoading = ref<boolean>(false);
const user = useUserStore();
const pageInfo = ref({
  cursor: null as null | string,
  isLast: false,
  size: 15,
});
chat.onOfflineList.splice(0);

/**
 * 加载数据
 */
async function loadData() {
  if (isLoading.value || pageInfo.value.isLast || chat.theContact.type !== RoomType.GROUP)
    return;
  isLoading.value = true;
  const { data } = await getRoomGroupUserPage(chat.theContact.roomId, pageInfo.value.size, pageInfo.value.cursor, user.getToken);

  pageInfo.value.isLast = data.isLast;
  pageInfo.value.cursor = data.cursor;
  if (data.list)
    chat.onOfflineList.push(...data.list);
  isLoading.value = false;
}

function reload() {
  chat.onOfflineList = [];
  pageInfo.value = {
    cursor: null,
    isLast: false,
    size: 15,
  };
  if (isLoading.value)
    return;
  isLoading.value = false;
  loadData();
}
// 添加好友
const theUser = ref<ChatMemberVO>();
const isShowApply = ref();


// 权限
const getTheRoleType = computed(() => {
  return chat.theContact?.member?.role;
});
const isTheGroupOwner = computed(() => {
  return chat.theContact?.member?.role === ChatRoomRoleEnum.OWNER;
});
// 是否有权限（踢出群聊、）
const isTheGroupPermission = computed(() => {
  return chat.theContact?.member?.role === ChatRoomRoleEnum.OWNER || chat.theContact?.member?.role === ChatRoomRoleEnum.ADMIN;
});

const colorMode = useColorMode();
// 右键菜单
function onContextMenu(e: MouseEvent, item: ChatMemberVO) {
  e.preventDefault();
  const isSelf = user.userInfo.id === item.userId;
  ContextMenu.showContextMenu({
    x: e.x,
    y: e.y,
    theme: colorMode.preference === "dark" ? "mac dark" : "wind10",
    items: [
      {
        label: "@ 他",
        hidden: isSelf,
        onClick: () => {
          chat.setAtUid(item.userId);
        },
      }, {
        icon: "btn-info i-solar:user-bold ",
        label: "联系他",
        hidden: isSelf,
        onClick: () => {
          chat.setTheFriendOpt(FriendOptType.User, {
            id: item.userId,
          });
          navigateTo({
            path: "/friend",
            query: {
              id: item.userId,
            },
            replace: false,
          });
        },
      },
      {
        label: "添加好友",
        icon: "i-carbon:add-large btn-info",
        hidden: isSelf,
        onClick: () => {
          // 确认是否为好友
          isChatFriend({ uidList: [item.userId] }, user.getToken).then((res) => {
            if (res.code !== StatusCode.SUCCESS)
              return ElMessage.error(res.msg || "申请失败，请稍后再试！");
            const user = res.data.checkedList.find(p => p.uid === item.userId);
            if (user && user.isFriend)
              return ElMessage.error("申请失败，和对方已是好友！");
            // 开启申请
            theUser.value = item;
            isShowApply.value = true;
          }).catch(() => {

          });
        },
      },
      {
        label: "管理员",
        icon: "i-solar:shield-user-bold-duotone btn-warning",
        hidden: isSelf || !isTheGroupOwner.value,
        children: [
          {
            label: "添加",
            hidden: item.roleType === ChatRoomRoleEnum.ADMIN,
            icon: "i-carbon:add-large btn-info",
            onClick: () => {
              toggleAdminRole({
                userId: item.userId,
                roomId: chat.theContact.roomId,
              }, ChatRoomRoleEnum.ADMIN);
            },
          },
          {
            label: "移除",
            // icon: "i-carbon:add-large btn-info",
            hidden: !item.roleType || item.roleType !== ChatRoomRoleEnum.ADMIN,
            onClick: () => {
              toggleAdminRole({
                userId: item.userId,
                roomId: chat.theContact.roomId,
              }, ChatRoomRoleEnum.MEMBER);
            },
          },
        ],
      },
      {
        label: "其他",
        children: [
          {
            label: "分享",
            icon: "i-solar:share-line-duotone",
            onClick: async () => {
              const res = await useAsyncCopyText(`${window.location.origin}/user/info?id=${item.userId}`);
              ElMessage.success({
                message: "成功复制至剪贴板！",
                grouping: true,
              });
            },
          },
        ],
      },
      {
        label: "踢出群聊",
        icon: "i-solar:logout-3-broken",
        hidden: isSelf || !isTheGroupPermission.value,
        onClick: () => {
          ElMessageBox.confirm("是否将该用户踢出群聊？", {
            center: true,
            confirmButtonText: "踢出",
            cancelButtonText: "取消",
            confirmButtonClass: "btn-error",
            lockScroll: false,
            callback: async (action: string) => {
              if (action === "confirm") {
                const res = await exitRoomGroupByUid(chat.theContact.roomId, item.userId, user.getToken);
                if (res.code === StatusCode.SUCCESS) {
                  ElNotification.success("踢出成功！");
                  chat.onOfflineList = chat.onOfflineList.filter(e => e.userId !== item.userId);
                }
              }
            },
          });
        },
      },
    ],
  });
}

/**
 * 切换管理员角色
 * @param dto 参数
 * @param type 转化类型
 */
function toggleAdminRole(dto: ChatRoomAdminAddDTO, type: ChatRoomRoleEnum) {
  const isAdmin = type === ChatRoomRoleEnum.ADMIN;
  ElMessageBox.confirm(`是否将该用户${isAdmin ? "设为" : "取消"}管理员？`, {
    center: true,
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    lockScroll: false,
    callback: async (action: string) => {
      if (action === "confirm") {
        const fn = isAdmin ? addChatRoomAdmin : delChatRoomAdmin;
        const res = await fn(dto, user.getToken);
        if (res.code === StatusCode.SUCCESS) {
          ElNotification.success("操作成功！");
          for (const p of chat.onOfflineList) {
            if (p.userId === dto.userId)
              return p.roleType = type;
          }
        }
      }
    },
  });
}

watchDebounced(() => chat.theContact.roomId, (val) => {
  if (val && chat.theContact.type === RoomType.GROUP)
    reload();
});
/**
 * 上下线消息
 */
watchThrottled(() => ws.wsMsgList.onlineNotice, (list: WSOnlineOfflineNotify[] = []) => {
  // 上下线消息
  list.forEach((p) => {
    if (!p.changeList)
      return;
    for (const item of chat.onOfflineList) {
      for (const k of p.changeList) {
        if (k.userId === item.userId) {
          item.activeStatus = k.activeStatus;
          break;
        }
      }
    }
  });
}, {
  deep: true,
  immediate: true,
});


const merberList = computed(() => {
  return chat.onOfflineList.sort((a, b) => b.activeStatus - a.activeStatus);
});

const ChatNewGroupDialogRef = ref();
const showAddDialog = ref(false);
// 邀请进群
function onAdd() {
  if (ChatNewGroupDialogRef.value) {
    ChatNewGroupDialogRef.value?.reload();
    if (ChatNewGroupDialogRef.value?.form)
      ChatNewGroupDialogRef.value.form.roomId = chat.theContact.roomId;
    showAddDialog.value = true;
  }
};


// 退出群聊
function exitGroup() {
  ElMessageBox.confirm(isTheGroupOwner.value ? "是否解散该群聊？" : "是否退出该群聊？", {
    center: true,
    confirmButtonText: isTheGroupOwner.value ? "解散" : "退出",
    cancelButtonText: "取消",
    lockScroll: false,
    callback: async (action: string) => {
      if (action === "confirm") {
        const res = await exitRoomGroup(chat.theContact.roomId, user.getToken);
        if (res.code === StatusCode.SUCCESS) {
          ElNotification.success("操作成功！");
          chat.setContact();
          chat.contactList = chat.contactList.filter((e: ChatContactVO) => e.roomId !== chat.theContact.roomId);
        }
      }
    },
  });
}
</script>

<template>
  <div
    v-if="chat.theContact.type === RoomType.GROUP && setting.isOpenGroupMember"
    v-bind="$attrs"
    class="group flex flex-col animate-[fade-in-right_300ms] gap-2 border-(0 l-1px default) p-0 transition-200 transition-width sm:(relative w-1/5 flex-col p-4)"
  >
    <div flex-row-bt-c flex-col gap-4 truncate pb-1rem pt-2 sm:flex-row>
      <i class="sm:(h-1.8em w-1.8em)" />
      <span>
        群成员
      </span>
      <div class="rounded-2rem p-1.5 transition-all border-default sm:border-0 group-hover:op-100 sm:op-0">
        <i class="block h-1.8em w-1.8em rounded-2rem btn-info sm:(h-1.6em w-1.6em) border-default" i-carbon:add-large @click="onAdd" />
      </div>
    </div>
    <el-scrollbar
      height="100%"
      class="mx-a h-70vh max-w-full w-fit w-full rounded-4rem md:(w-full) sm:rounded-1rem"
      view-class="max-w-full mx-a  tracking-0.1em flex flex-col gap-2"
      wrap-class="w-full mx-a"
    >
      <ListAutoIncre
        :immediate="true"
        :auto-stop="true"
        :no-more="pageInfo.isLast"
        :loading="isLoading"
        @load="loadData"
      >
        <div
          v-for="p in merberList" :key="p.userId"
          :class="p.activeStatus === ChatOfflineType.ONLINE ? 'live' : 'op-50 filter-grayscale filter-grayscale-100 '"
          class="user-card flex-shrink-0"
          @contextmenu="onContextMenu($event, p)"
          @click="onContextMenu($event, p)"
        >
          <div class="relative flex-row-c-c">
            <CardElImage
              :src="BaseUrlImg + p.avatar" fit="cover"
              class="h-2.2em w-2.2em flex-shrink-0 overflow-auto rounded-1/2 object-cover border-default"
            />
            <span class="g-avatar" />
          </div>
          <small hidden truncate md:inline-block>{{ p.nickName || "未填写" }}</small>
          <div class="tags ml-a block hidden pl-1 sm:block">
            <el-tag v-if="p.userId === user.userInfo.id" class="mr-1" style="font-size: 0.6em;" size="small" type="warning">
              我
            </el-tag>
            <el-tag v-if="p.roleType !== null && p.roleType !== ChatRoomRoleEnum.MEMBER" class="mr-1" style="font-size: 0.6em;" size="small" effect="dark" type="info">
              {{ chatRoomRoleEnumMap[p.roleType || ChatRoomRoleEnum.MEMBER] }}
            </el-tag>
          </div>
        </div>
        <template #done>
          <p mx-a hidden truncate text-center text-0.8em op-60 sm:block>
            暂无更多
          </p>
        </template>
      </ListAutoIncre>
    </el-scrollbar>
    <btn-el-button class="op-0 group-hover:op-100" icon-class="i-solar:logout-3-broken mr-2" round type="danger" plain @click="exitGroup()">
      <span hidden sm:block>
        {{ getTheRoleType === ChatRoomRoleEnum.OWNER ? '解散群聊' : '退出群聊' }}
      </span>
    </btn-el-button>

    <!-- 邀请进群 -->
    <LazyChatNewGroupDialog ref="ChatNewGroupDialogRef" v-model="showAddDialog" />

    <!-- 好友申请 -->
    <LazyChatFriendApplyDialog v-model:show="isShowApply" :user-id="theUser?.userId" />
  </div>
</template>

<style lang="scss" scoped>
.g-avatar {
  display: block;
  width: 0.4em;
  height: 0.4em;
  border-radius: 50%;
  position: absolute;
  right: 0.2em;
  bottom: 0.2em;
  --at-apply: "border-default";
  z-index: 1;
}
.user-card {
  --at-apply:'h-fit p-1.5 relative w-fit flex items-center gap-1 truncate rounded-2rem filter-grayscale transition-300 transition-all sm:w-full active:scale-96 border-default hover:(border-[var(--el-color-primary)] bg-white op-100 shadow shadow-inset dark:bg-dark-9)'
}
.live {
  position: relative;
  opacity: 60;
  --at-apply: "animate-[fade-in_0.6s]";

  .g-avatar {
    background-color: var(--el-color-info);
  }

  filter: grayscale(0);

}
:deep(.el-scrollbar__thumb) {
  display: none;
}
</style>
