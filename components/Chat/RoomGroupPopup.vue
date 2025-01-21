<script lang="ts" setup>
import type { WSOnlineOfflineNotify } from "~/types/chat/WsType";
import ContextMenu from "@imengyu/vue3-context-menu";
import { type ChatRoomAdminAddDTO, ChatRoomRoleEnum, ChatRoomRoleEnumMap } from "~/composables/api/chat/room";

const chatRoomRoleEnumMap = ChatRoomRoleEnumMap;
const ws = useWs();
const chat = useChatStore();
const setting = useSettingStore();
const isLoading = ref<boolean>(false);
const memberScrollbarRef = ref();
const user = useUserStore();
const isGrid = useLocalStorage(`chat_room_group_member_show_type_${user.userInfo.id}`, false);
const pageInfo = ref({
  cursor: null as null | string,
  isLast: false,
  size: 15,
});
chat.onOfflineList.splice(0);
// 编辑群聊
const theContactClone = ref<Partial<ChatContactDetailVO>>();
const editFormFieldRaw = ref("");
const nameInputRef = ref();
const noticeInputRef = ref();
const editFormField = computed<string>({
  get() {
    return editFormFieldRaw.value;
  },
  set(val) {
    editFormFieldRaw.value = val;
    nextTick(() => {
      if (val === "notice" && noticeInputRef.value)
        noticeInputRef?.value?.focus();
      else if (val === "name" && nameInputRef.value)
        nameInputRef?.value?.focus();
    });
  },
});
const isLord = computed(() => chat.theContact.member?.role === ChatRoomRoleEnum.OWNER);
const TextMap = {
  name: "群名称",
  notice: "群公告",
  avatar: "群头像",
};
watch(() => chat.theContact, (val) => {
  const data = JSON.parse(JSON.stringify(val)) as ChatContactDetailVO;
  if (data.roomGroup && !data.roomGroup?.detail)
    data.roomGroup.detail = {};
  theContactClone.value = data;
}, { deep: true, immediate: true });

// 群头像
const inputOssFileUploadRef = ref();
const imgList = ref<OssFile[]>([]);
function onSubmitImages(url: string) {
  if (url)
    submitUpdateRoom("avatar", url);
}
async function toggleImage() {
  if (!isLord.value) {
    ElMessage.warning("暂无权限！");
    return;
  }
  if (imgList.value.length > 0) {
    imgList.value = [];
    return;
  }
  await inputOssFileUploadRef.value?.resetInput();
}
watch(() => chat.theContact.avatar, (val) => {
  if (val) {
    imgList.value = [{
      id: BaseUrlImg + val,
      key: val,
      file: {} as File,
      percent: 100,
      status: "success",
    }];
  }
  else { imgList.value = []; }
}, { deep: true, immediate: true });
/**
 * 修改群聊详情
 * @param field 修改字段
 * @param val 修改的值
 */
async function submitUpdateRoom(field: "name" | "avatar" | "notice", val: string | undefined | null = "") {
  if (field === "name" && val && val.trim().length <= 0)
    return ElMessage.warning("请输入内容！");
  const data = field === "notice"
    ? {
        detail: {
          [field]: val?.trim(),
        },
      }
    : {
        [field]: val?.trim(),
      } as UpdateRoomGroupDTO;
  ElMessageBox.confirm(`是否确认修改${TextMap[field]}？`, {
    title: TextMap[field] || "提示",
    center: true,
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    confirmButtonClass: "el-button-primary",
    lockScroll: false,
    callback: async (action: string) => {
      if (action === "confirm") {
        const res = await updateGroupRoomInfo(chat.theContact.roomId, data, user.getToken);
        if (res.code === StatusCode.SUCCESS && res.data === 1) {
          // 更新会话
          const item = chat.contactMap[chat.theContact.roomId];
          if (field === "name") {
            if (item)
              item.name = val?.trim() as string;
            chat.theContact.name = val?.trim() as string;
          }
          else if (field === "avatar") {
            if (item)
              item.avatar = val?.trim() as string;
            chat.theContact.avatar = val?.trim() as string;
          }
          else if (field === "notice") {
            if (!chat.theContact?.roomGroup)
              chat.theContact.roomGroup = { detail: {} } as ChatRoomGroup;
            if (!chat.theContact?.roomGroup?.detail)
              chat.theContact.roomGroup.detail = {};
            chat.theContact.roomGroup.detail.notice = val?.trim() as string;
          }
          editFormField.value = "";
        }
      }
      else {
        const data = JSON.parse(JSON.stringify(chat.theContact)) as ChatContactDetailVO;
        if (data.roomGroup && !data.roomGroup?.detail)
          data.roomGroup.detail = {};
        theContactClone.value = data;
        editFormField.value = "";
      }
    },
  });
}
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
  if (data && data.list)
    chat.onOfflineList.push(...data.list);
  isLoading.value = false;
}

async function reload() {
  chat.onOfflineList = [];
  pageInfo.value = {
    cursor: null,
    isLast: false,
    size: 15,
  };
  if (isLoading.value)
    return;
  isLoading.value = false;
  // 动画
  await loadData();
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
    zIndex: 3000, // 高于遮罩层
    theme: colorMode.preference === "dark" ? "mac dark" : "wind10",
    items: [
      {
        label: "@ 他",
        hidden: isSelf,
        onClick: () => {
          chat.setAtUid(item.userId);
        },
      },
      {
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
            const user = res.data.checkedList.find((p: FriendCheck) => p.uid === item.userId);
            if (user && user.isFriend)
              return ElMessage.warning("申请失败，和对方已是好友！");
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
              const { isSupported, share } = useShare();
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


const merberList = computed(() => chat.onOfflineList.sort((a, b) => b.activeStatus - a.activeStatus));

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
          chat.removeContact(chat.theContact.roomId);
        }
      }
    },
  });
}
</script>

<template>
  <div
    v-bind="$attrs"
    class="group relative"
  >
    <div flex-row-bt-c flex-shrink-0 flex-row gap-4 truncate pb-4>
      <div class="flex p-1.5" @click="isGrid = !isGrid">
        <i class="block h-5 w-5 op-80 btn-info border-default" :class="isGrid ? 'i-solar:hamburger-menu-line-duotone w-4 h-4' : 'i-solar:widget-bold-duotone w-2 h-2'" />
      </div>
      <small>群成员</small>
      <div class="rounded-2rem p-1.5 border-default" @click="onAdd">
        <i class="block h-1.8em h-5 w-1.8em w-5 rounded-2rem btn-info border-default" i-carbon:add-large />
      </div>
    </div>
    <el-scrollbar ref="memberScrollbarRef" style="height: auto;">
      <ListAutoIncre
        :immediate="true"
        :auto-stop="false"
        :no-more="pageInfo.isLast"
        @load="loadData"
      >
        <div :class="isGrid ? 'flex-row is-grid' : 'flex-col'" relative flex flex-wrap gap-0>
          <div
            v-for="p in merberList" :key="p.userId"
            :class="p.activeStatus === ChatOfflineType.ONLINE ? 'live' : 'op-50 filter-grayscale filter-grayscale-100 '"
            class="user-card flex-shrink-0 cursor-pointer"
            @contextmenu="onContextMenu($event, p)"
            @click="onContextMenu($event, p)"
          >
            <div class="relative flex-row-c-c" :title="p.nickName || '未知'">
              <CardElImage
                v-if="p.avatar"
                :src="BaseUrlImg + p.avatar" fit="cover"
                class="h-2.4rem w-2.4rem flex-shrink-0 overflow-auto rounded-1/2 object-cover border-default"
              />
              <small
                v-else
                class="h-2.4rem w-2.4rem flex-row-c-c flex-shrink-0 overflow-auto rounded-1/2 object-cover border-default"
              >
                <i class="i-solar-user-line-duotone p-2.5 op-80" />
              </small>
              <span class="g-avatar" />
            </div>
            <small v-if="!isGrid" truncate>{{ p.nickName || "未填写" }}</small>
            <div v-if="!isGrid" class="tags ml-a block pl-1">
              <el-tag v-if="p.userId === user.userInfo.id" class="mr-1" style="font-size: 0.6em;border-radius: 2rem;" size="small" type="warning">
                我
              </el-tag>
              <el-tag v-if="p.roleType !== null && p.roleType !== ChatRoomRoleEnum.MEMBER" class="mr-1" style="font-size: 0.6em;border-radius: 2rem;" size="small" effect="dark" type="info">
                {{ chatRoomRoleEnumMap[p.roleType || ChatRoomRoleEnum.MEMBER] }}
              </el-tag>
            </div>
          </div>
        </div>
        <template #done />
      </ListAutoIncre>
      <small
        class="shadow-bt sticky bottom-0 left-0 block w-full cursor-pointer pb-2 text-center" @click="() => {
          memberScrollbarRef.scrollTo({ left: 0, top: memberScrollbarRef?.wrapRef?.scrollHeight || 0, behavior: 'smooth' })
        }"
      >
        <i i-solar:alt-arrow-down-outline p-2 btn-info />
      </small>
    </el-scrollbar>
    <div class="mt-2 w-full flex-1 border-0 border-t-1px px-2 pt-2 text-3.5 leading-1.8em border-default">
      <div relative mt-3>
        群头像
        <InputOssFileUpload
          ref="inputOssFileUploadRef"
          :is-animate="false"
          :show-edit="false"
          :disable="!isLord"
          :multiple="false"
          :limit="1"
          input-class="w-3rem mt-1 h-3rem flex-shrink-0 card-default"
          :class="!isLord ? 'cursor-no-drop' : 'cursor-pointer'"
          :upload-quality="0.3"
          :model-value="imgList"
          @click="toggleImage"
          @error-msg="(msg:string) => {
            ElMessage.error(msg)
          }"
          @submit="onSubmitImages"
        />
      </div>
      <div mt-3 class="label-item">
        群聊名称
        <i v-show="isLord && editFormField !== 'name'" i-solar:pen-2-bold ml-2 p-2 op-0 transition-opacity @click="editFormField = 'name'" />
        <div
          class="dark:op-70" @click="() => {
            if (isLord && editFormField !== 'name') {
              editFormField = 'name'
            }
          }"
        >
          <el-input
            v-if="theContactClone"
            ref="nameInputRef"
            v-model.lazy="theContactClone.name"
            :disabled="!isLord || editFormField !== 'name'"
            type="text"
            :maxlength="30"
            style="width: fit-content;"
            placeholder="未填写"
            @focus="editFormField = 'name'"
            @blur.stop="submitUpdateRoom('name', theContactClone.name)"
          />
        </div>
      </div>
      <div class="label-item">
        <div mt-3>
          群公告
          <i v-show="isLord && editFormField !== 'notice'" i-solar:pen-2-bold ml-2 p-2 op-0 transition-opacity @click="editFormField = 'notice'" />
        </div>
        <textarea
          v-if="theContactClone?.roomGroup?.detail"
          ref="noticeInputRef"
          v-model="theContactClone.roomGroup.detail.notice"
          :disabled="!isLord || editFormField !== 'notice'"
          autofocus
          :rows="8"
          :maxlength="200"
          class="mt-2 border-0 bg-transparent dark:op-70"
          type="textarea"
          style="resize:none;width: 100%;"
          placeholder="未填写"
          @focus="editFormField = 'notice'"
          @blur="submitUpdateRoom('notice', theContactClone?.roomGroup?.detail?.notice)"
        />
      </div>
    </div>
    <btn-el-button class="op-0 group-hover:op-100" icon-class="i-solar:logout-3-broken mr-2" type="danger" plain round @click="exitGroup()">
      <span>
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
  --at-apply:'h-fit flex-row-c-c p-1.6 relative gap-2 truncate rounded-2rem filter-grayscale transition-300 transition-all w-full hover:(border-[var(--el-color-primary)] bg-white op-100 shadow shadow-inset dark:bg-dark-9)';
}

.is-grid {
    // grid-template-columns: repeat(auto-fit, minmax(3em, 1fr)); // 设置网格布局，并设置列数为自动适应，每个列的宽度为1fr（占据可用空间）
  .user-card {
    --at-apply:'sm:mx-0 mx-a';
    width: fit-content;
  }
}

.live {
  position: relative;
  opacity: 60;
  --at-apply: "animate-[fade-in_0.3s]";

  .g-avatar {
    background-color: var(--el-color-info);
  }

  filter: grayscale(0);

}
:deep(.el-scrollbar__thumb) {
  display: none;
}
.label-item {
  :deep(.el-input) {
    .el-input__wrapper {
      background: transparent;
      box-shadow: none;
      color: inherit !important;
      padding: 0;
    }
    .el-input__inner {
      color: inherit !important;
      caret-color: var(--el-color-info);
      cursor: pointer;
    }
  }
  &:hover i {
    opacity: 1;
    cursor: pointer
  }
}
:deep(.el-textarea) {
  .el-textarea__inner {
    color: inherit !important;
    caret-color: var(--el-color-info);
    box-shadow: none;
    padding: 0;
    background-color: transparent;
    cursor: pointer;
    resize:none;
  }
  &.is-disabled {
    box-shadow: none;
    resize:none;
  }
}
.shadow-bt {
  // 渐变色
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 100%);
}
.dark .shadow-bt {
  background: linear-gradient(to bottom, rgba(34, 34, 34, 0) 0%, rgba(34, 34, 34, 1) 100%);
}
</style>
