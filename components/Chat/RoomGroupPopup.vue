<script lang="ts" setup>
import type { ChatRoomAdminAddDTO } from "~/composables/api/chat/room";
import type { WSOnlineOfflineNotify } from "~/types/chat/WsType";
import ContextMenu from "@imengyu/vue3-context-menu";
import { ChatRoomRoleEnum } from "~/composables/api/chat/room";

const ws = useWsStore();
const chat = useChatStore();
const setting = useSettingStore();
const user = useUserStore();

// ref
// const memberScrollbarRef = useTemplateRef("memberScrollbarRef");
const chatNewGroupDialogRef = useTemplateRef("chatNewGroupDialogRef");
// state
const theUser = ref<ChatMemberVO>(); // 添加好友
const showSearch = ref(false);
const searchUserWord = ref("");
const searchInputRef = useTemplateRef("searchInputRef");
const isShowApply = ref(false);
const showAddDialog = ref(false);
const isGrid = useLocalStorage(`chat_room_group_member_show_type_${user.userInfo.id}`, false);
// 计算
const getTheRoleType = computed(() => chat.theContact?.member?.role); // 角色
const isTheGroupOwner = computed(() => chat.theContact?.member?.role === ChatRoomRoleEnum.OWNER);
const isTheGroupPermission = computed(() => chat.theContact?.member?.role === ChatRoomRoleEnum.OWNER || chat.theContact?.member?.role === ChatRoomRoleEnum.ADMIN); // 是否有权限（踢出群聊、）

const memberList = computed(() => {
  const str = searchUserWord.value.trim();
  if (str) {
    return (chat.currentMemberList || []).filter(user => !!user?.nickName?.toLocaleLowerCase()?.includes(str));
  }
  return (chat.currentMemberList || []).sort((a, b) => b.activeStatus - a.activeStatus);
});
const { list: vMemberList, scrollTo, containerProps, wrapperProps } = useVirtualList(
  memberList,
  {
    itemHeight: 50,
    overscan: 10,
  },
);
const onScroll = useDebounceFn((e) => {
  const dom = e.target as HTMLElement;
  if (dom.scrollHeight - dom.scrollTop <= 400) {
    loadData();
  }
}, 300);
const isNotExistOrNorFriend = computed(() => chat.theContact.selfExist === isTrue.FALESE); // 自己不存在 或 不是好友  || chat.contactMap?.[chat.theContact.roomId]?.isFriend === 0
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

/**
 * 修改群聊详情
 * @param field 修改字段
 * @param val 修改的值
 */
async function submitUpdateRoom(field: "name" | "avatar" | "notice", val: string | undefined | null = "") {
  if (field === "name" && val && val.trim().length <= 0)
    return ElMessage.warning("请输入内容！");
  // 没有变化则不触发修改

  if ((field === "name" && chat.theContact?.[field] === val) || (field === "notice" && chat?.theContact?.roomGroup?.detail?.notice === val)) {
    editFormField.value = "";
    return;
  }
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
              return;
            if (!chat.theContact.roomGroup.detail)
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
async function loadData(roomId?: number) {
  roomId = roomId || chat.theContact.roomId;
  if (chat?.roomMapCache?.[roomId]?.isLoading || chat.roomMapCache[roomId]?.isReload || chat.memberPageInfo.isLast || chat.theContact.type !== RoomType.GROUP)
    return;
  chat.roomMapCache[roomId]!.isLoading = true;
  const { data } = await getRoomGroupUserPage(roomId, chat.roomMapCache[roomId]?.pageInfo.size || 20, chat.roomMapCache[roomId]?.pageInfo.cursor || undefined, user.getToken);
  chat.memberPageInfo.isLast = data.isLast;
  chat.memberPageInfo.cursor = data.cursor || undefined;
  if (data && data.list) {
    chat?.roomMapCache?.[roomId]!.userList.push(...data.list);
  }
  await nextTick();
  chat.roomMapCache[roomId]!.isLoading = false;
}

/**
 * 重新加载
 * @param roomId 房间id
 */
async function reload(roomId?: number) {
  roomId = roomId || chat.theContact.roomId;
  if (chat.roomMapCache[roomId]?.isLoading || chat.roomMapCache[roomId]?.isReload || chat.theContact.type !== RoomType.GROUP)
    return;
  chat.roomMapCache[roomId] = {
    isLoading: false,
    isReload: false,
    cacheTime: Date.now(),
    pageInfo: {
      cursor: undefined,
      isLast: false,
      size: 20,
    },
    userList: [],
  };
  // 动画
  try {
    chat.roomMapCache[roomId]!.isLoading = true;
    chat.roomMapCache[roomId]!.isReload = true;
    const { data } = await getRoomGroupUserPage(roomId, chat.roomMapCache[roomId]?.pageInfo.size || 20, chat.roomMapCache[roomId]?.pageInfo.cursor || undefined, user.getToken);
    if (roomId !== chat.theContact.roomId) {
      return;
    }
    chat.memberPageInfo.isLast = data.isLast;
    chat.memberPageInfo.cursor = data.cursor || undefined;
    if (data && data.list) {
      chat?.roomMapCache?.[roomId]!.userList.push(...data.list);
    }
    chat.roomMapCache[roomId]!.isLoading = false;
  }
  finally {
    await nextTick();
    chat.roomMapCache[roomId]!.isLoading = false;
    chat.roomMapCache[roomId]!.isReload = false;
  }
}
// 右键菜单
function onContextMenu(e: MouseEvent, item: ChatMemberVO) {
  e.preventDefault();
  const isSelf = user.userInfo.id === item.userId;
  ContextMenu.showContextMenu({
    x: e.x,
    y: e.y,
    zIndex: 3000, // 高于遮罩层
    theme: setting.contextMenuTheme,
    items: [
      {
        label: "@ 他",
        customClass: "group",
        hidden: isSelf,
        onClick: () => {
          chat.setAtUid(item.userId);
        },
      },
      {
        label: "添加好友",
        customClass: "group",
        icon: "group-hover:scale-110 transition-transform i-solar:user-plus-broken btn-info",
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
        icon: "group-hover:scale-110 transition-transform btn-info i-solar:user-bold ",
        label: "联系他",
        customClass: "group",
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
        label: "管理员",
        customClass: "group",
        icon: "group-hover:scale-110 transition-transform i-solar:shield-user-bold-duotone btn-warning",
        hidden: isSelf || !isTheGroupOwner.value,
        children: [
          {
            label: "添加",
            customClass: "group",
            hidden: item.roleType === ChatRoomRoleEnum.ADMIN,
            icon: "group-hover:scale-110 transition-transform i-carbon:add-large btn-info",
            onClick: () => {
              toggleAdminRole({
                userId: item.userId,
                roomId: chat.theContact.roomId,
              }, ChatRoomRoleEnum.ADMIN);
            },
          },
          {
            label: "移除",
            customClass: "group",
            icon: "group-hover:scale-110 transition-transform i-solar:add-circle-linear btn-info",
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
        customClass: "group",
        children: [
          {
            label: "分享",
            customClass: "group",
            icon: "group-hover:scale-110 transition-transform i-solar:share-line-duotone",
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
        customClass: "group",
        icon: "group-hover:scale-110 transition-transform i-solar:logout-3-broken",
        divided: "up",
        hidden: isSelf || !isTheGroupPermission.value,
        onClick: () => {
          ElMessageBox.confirm("是否将该用户踢出群聊？", {
            title: "提示",
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
                  chat.currentMemberList = chat.currentMemberList.filter(e => e.userId !== item.userId);
                  await nextTick();
                  containerProps.onScroll();
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
    title: "提示",
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
          // 更新缓存中的角色信息
          const index = chat.currentMemberList.findIndex(p => p.userId === dto.userId);
          if (index !== -1 && chat.currentMemberList[index])
            chat.currentMemberList[index].roleType = type;
        }
      }
    },
  });
}

/**
 * 上下线消息
 */
watchThrottled(() => ws.wsMsgList.onlineNotice, (list: WSOnlineOfflineNotify[] = []) => {
  // 上下线消息
  list.forEach((p) => {
    if (!p.changeList)
      return;
    for (const item of (chat.roomMapCache?.[chat.theContact.roomId]?.userList || [])) {
      for (const k of p.changeList) {
        if (k.userId === item.userId) {
          item.activeStatus = k.activeStatus;
          const find = chat.currentMemberList?.find(p => p.userId === item.userId);
          if (find)
            find.activeStatus = k.activeStatus; // 更新缓存中的状态
          break;
        }
      }
    }
  });
}, {
  deep: true,
  immediate: true,
});

watch(() => chat.theContact, (val) => {
  const data = JSON.parse(JSON.stringify(val)) as ChatContactDetailVO;
  if (data.roomGroup && !data.roomGroup?.detail)
    data.roomGroup.detail = {};
  theContactClone.value = data;
}, { deep: true, immediate: true });


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

// 监听群成员列表变化
watch(() => chat.theContactId, async (newRoomId) => {
  searchUserWord.value = "";
  await nextTick();
  containerProps.onScroll();
  scrollTo(0);
  if (!newRoomId) {
    return;
  }
  if (chat.roomMapCache[newRoomId]?.cacheTime && Date.now() - chat.roomMapCache[newRoomId]?.cacheTime < 300000) { // 缓存5分钟
    return;
  }
  await reload();
  await nextTick();
  containerProps.onScroll(); // 切换会话成员列表滚动条位置重置
  scrollTo(0);
}, {
});
// 邀请进群
function onAdd() {
  if (chatNewGroupDialogRef.value) {
    chatNewGroupDialogRef.value?.reload();
    if (chatNewGroupDialogRef.value?.form)
      chatNewGroupDialogRef.value.form.roomId = chat.theContact.roomId;
    showAddDialog.value = true;
  }
};

function onExitOrClearGroup() {
  if (isNotExistOrNorFriend.value) {
    // 不显示聊天
    chat.deleteContactConfirm(chat.theContact.roomId, () => {
    });
    return;
  }
  chat.exitGroupConfirm(chat.theContact.roomId, isTheGroupOwner.value, () => {
    chat.removeContact(chat.theContact.roomId);
  });
}

onMounted(() => {
  // 初始化加载
  reload();
  // 整个生命周期不能解除
  mitter.on(MittEventType.RELOAD_MEMBER_LIST, ({ type, payload: { roomId, userId } }) => {
    if (chat.roomMapCache[roomId] === undefined) {
      return;
    }
    reload(roomId);
  });
});
</script>

<template>
  <div
    v-if="setting.isOpenGroupMember && chat.theContact.type === RoomType.GROUP"
    v-bind="$attrs"
    class="group relative"
  >
    <div flex-row-bt-c flex-shrink-0 flex-row truncate>
      <i
        class="i-solar:magnifer-linear block h-4.5 w-4.5 btn-info"
        @click="() => {
          showSearch = !showSearch
          if (showSearch) {
            searchInputRef?.focus?.()
          }
        }"
      />
      <small>群成员</small>
      <div class="rounded-2rem p-1.5" @click="onAdd">
        <i class="block h-1.8em h-5 w-1.8em w-5 rounded-2rem btn-info border-default" i-carbon:add-large />
      </div>
    </div>
    <!-- 搜索群聊 -->
    <div
      class="header h-2em transition-height"
      :class="!showSearch ? '!h-0 overflow-y-hidden' : ''"
    >
      <ElInput
        ref="searchInputRef"
        v-model.lazy="searchUserWord"
        style="height: 2em;"
        name="search-content"
        type="text"
        clearable
        autocomplete="off"
        :prefix-icon="ElIconSearch"
        minlength="2"
        maxlength="30"
        placeholder="搜索群友"
        @input="scrollTo(0)"
      />
    </div>
    <div
      v-bind="containerProps"
      class="scroll-bar relative h-300px"
      @scroll="onScroll"
    >
      <div
        v-bind="wrapperProps"
        class="relative"
      >
        <div
          v-for="p in vMemberList"
          :key="`${chat.theContact.roomId}_${p.data.userId}`"
          :class="p.data.activeStatus === ChatOfflineType.ONLINE ? 'live' : 'op-60 filter-grayscale filter-grayscale-100 '"
          class="user-card"
          @contextmenu="onContextMenu($event, p.data)"
          @click="onContextMenu($event, p.data)"
        >
          <div class="relative flex-row-c-c" :title="p.data.nickName || '未知'">
            <CardElImage
              :default-src="p.data.avatar" fit="cover"
              error-class="i-solar-user-line-duotone p-2.5 op-80"
              class="h-2.4rem w-2.4rem flex-shrink-0 overflow-auto rounded-1/2 object-cover border-default"
            />
            <span class="g-avatar" />
          </div>
          <small truncate>{{ p.data.nickName || "未填写" }}</small>
          <div class="tags ml-a block pl-1">
            <el-tag v-if="p.data.userId === user.userInfo.id" class="mr-1" style="font-size: 0.6em;border-radius: 2rem;" size="small" type="warning">
              我
            </el-tag>
            <el-tag v-if="p.data.roleType !== null && p.data.roleType !== ChatRoomRoleEnum.MEMBER" class="mr-1" style="font-size: 0.6em;border-radius: 2rem;" size="small" effect="dark" type="info">
              {{ ChatRoomRoleEnumMap[p.data.roleType || ChatRoomRoleEnum.MEMBER] }}
            </el-tag>
          </div>
        </div>
      </div>
      <!-- <small
        class="shadow-linear fixed bottom-0 left-0 block h-2em w-full cursor-pointer text-center"
        @click="scrollTo(chat.currentMemberList.length - 1)"
      >
        <i i-solar:alt-arrow-down-outline p-2 btn-info />
      </small> -->
    </div>
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
            @keydown.enter="submitUpdateRoom('name', theContactClone.name)"
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
          @keydown.enter.stop="submitUpdateRoom('notice', theContactClone?.roomGroup?.detail?.notice)"
          @blur="submitUpdateRoom('notice', theContactClone?.roomGroup?.detail?.notice)"
        />
      </div>
    </div>
    <btn-el-button
      v-show="!chat.contactMap[chat.theContact.roomId]?.hotFlag" v-memo="[isNotExistOrNorFriend, isTheGroupOwner]" class="group-hover:op-100 sm:op-0" icon-class="i-solar:logout-3-broken mr-2"
      type="danger"
      round
      plain
      @click="onExitOrClearGroup"
    >
      <span>
        {{ isNotExistOrNorFriend ? '不显示聊天' : isTheGroupOwner ? '解散群聊' : '退出群聊' }}
      </span>
    </btn-el-button>
    <!-- 邀请进群 -->
    <LazyChatNewGroupDialog ref="chatNewGroupDialogRef" v-model="showAddDialog" />
    <!-- 好友申请 -->
    <LazyChatFriendApplyDialog v-model:show="isShowApply" :user-id="theUser?.userId" />
  </div>
</template>

<style lang="scss" scoped>
.g-avatar {
  --at-apply: "border-default z-1 absolute bottom-0.2em right-0.2em rounded-full block w-2 h-2 ";
}
.user-card {
  --at-apply: "h-50px flex-shrink-0 cursor-pointer flex-row-c-c p-1.5 relative gap-2 truncate rounded-2rem filter-grayscale w-full hover:(bg-color-2 op-100)";
  .tags {
    :deep(.el-tag) {
      transition: none;
    }
  }
}

.is-grid {
    // grid-template-columns: repeat(auto-fit, minmax(3em, 1fr)); // 设置网格布局，并设置列数为自动适应，每个列的宽度为1fr（占据可用空间）
  .user-card {
    --at-apply:'sm:mx-0 mx-a';
    width: fit-content;
  }
}

.live {
  .g-avatar {
    background-color: var(--el-color-info);
  }
  filter: none;
}
:deep(.el-scrollbar__thumb) {
  opacity: 0.5;
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
.shadow-linear {
  // 渐变色
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 100%);
}
.dark .shadow-linear {
  background: linear-gradient(to bottom, rgba(31, 31, 31, 0) 0%, rgba(31, 31, 31, 1) 100%);
}

.header {
  :deep(.el-input) {
    .el-input__wrapper {
      --at-apply: "!shadow-none text-sm !outline-none bg-color-2 dark:bg-dark-7";
    }
  }
  .icon {
    --at-apply: "h-2rem w-2rem flex-row-c-c btn-primary-bg  bg-color-2 dark:bg-dark-7";
  }
}

.scroll-bar {
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 0.25rem;
  }
  &:hover {
    &::-webkit-scrollbar-thumb {
      background-color: #85858538;
    }
  }
  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
//   // scroll-behavior: smooth;
}
</style>
