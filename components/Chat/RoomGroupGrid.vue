<script lang="ts" setup>
import ContextMenu from "@imengyu/vue3-context-menu";
import { type ChatRoomAdminAddDTO, ChatRoomRoleEnum, ChatRoomRoleEnumMap } from "~/composables/api/chat/room";

const props = defineProps<{ data: ChatContactVO }>();
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
  if (isLoading.value || pageInfo.value.isLast || props.data.type !== RoomType.GROUP)
    return;
  isLoading.value = true;
  const { data } = await getRoomGroupUserPage(props.data.roomId, pageInfo.value.size, pageInfo.value.cursor, user.getToken);
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
  if (!isLoading.value) {
    isLoading.value = false;
    loadData();
  }
}
// 添加好友
const theUser = ref<ChatMemberVO>();
const isShowApply = ref();


// 权限
const getTheRoleType = computed(() => {
  return props.data?.member?.role;
});
const isTheGroupOwner = computed(() => {
  return props.data?.member?.role === ChatRoomRoleEnum.OWNER;
});
// 是否有权限（踢出群聊、）
const isTheGroupPermission = computed(() => {
  return props.data?.member?.role === ChatRoomRoleEnum.OWNER || props.data?.member?.role === ChatRoomRoleEnum.ADMIN;
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
            path: "/chat/friend",
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
                roomId: props.data.roomId,
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
                roomId: props.data.roomId,
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
                const res = await exitRoomGroupByUid(props.data.roomId, item.userId, user.getToken);
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
 * 切花管理员角色
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

watchDebounced(() => props.data.roomId, (val) => {
  if (val && props.data.type === RoomType.GROUP)
    reload();
});
/**
 * 上下线消息
 */
watchThrottled(() => ws.wsMsgList.onlineNotice, (list) => {
  // 上下线消息
  if (list.length) {
    for (const p of list) {
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
    }
  }
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
      ChatNewGroupDialogRef.value.form.roomId = props.data.roomId;
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
        const res = await exitRoomGroup(props.data.roomId, user.getToken);
        if (res.code === StatusCode.SUCCESS) {
          ElNotification.success("操作成功！");
          chat.setContact();
          chat.contactList = chat.contactList.filter((e: ChatContactVO) => e.roomId !== props.data.roomId);
        }
      }
    },
  });
}
</script>

<template>
  <div
    v-if="data.type === RoomType.GROUP && setting.isOpenGroupMember"
    v-bind="$attrs"
  >
    <div flex-row-bt-c class="mx-a w-3/4 pb-4">
      <i class="sm:(h-1.8em w-1.8em)" />
      <span>
        群成员
      </span>
      <i class="block h-1.8em w-1.8em rounded-2rem btn-info sm:(h-1.6em w-1.6em) border-default" i-carbon:add-large @click="onAdd" />
    </div>
    <el-scrollbar
      height="45vh"
      view-class="max-w-full mx-a  tracking-0.1em flex flex-col gap-2"
      wrap-class="w-full mx-a"
    >
      <ListAutoIncre
        :immediate="true"
        :auto-stop="true"
        :no-more="!isLoading && pageInfo.isLast"
        loading-class="mx-a mb-2 h-1rem w-1rem animate-[spin_2s_infinite_linear] rounded-4px bg-[var(--el-color-primary)] py-2"
        :loading="isLoading"
        @load="loadData"
      >
        <div class="grid grid-cols-4 mx-a sm:(grid-cols-6 w-2/3 gap-4)">
          <div
            v-for="p in merberList"
            :key="p.userId"
            :class="p.activeStatus === ChatOfflineType.ONLINE ? 'live' : 'op-50 filter-grayscale filter-grayscale-100 '"
            class="flex-row-c-c flex-col p-2 btn-primary-bg"
            @contextmenu="onContextMenu($event, p)"
            @click="chat.setTheFriendOpt(FriendOptType.User, {
              id: p.userId,
            })"
          >
            <div relative h-3.8em w-3.8em>
              <CardElImage
                :src="BaseUrlImg + p.avatar" fit="cover"
                class="h-full w-full border-default v-card"
              />
              <span class="g-avatar" />
            </div>
            <small mx-a mt-2 w-5em truncate text-center>{{ p.nickName }}</small>
          </div>
        </div>
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
  width: 0.6em;
  height: 0.6em;
  border-radius: 50%;
  position: absolute;
  right: 0.2em;
  bottom: 0.2em;
  --at-apply: "border-default";
  z-index: 1;
}
.user-card {
  --at-apply: "";
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
