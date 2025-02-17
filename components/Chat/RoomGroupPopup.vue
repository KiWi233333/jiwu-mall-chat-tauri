<script lang="ts" setup>
import { ChatRoomRoleEnum } from "~/composables/api/chat/room";

type EditFormItems = "name" | "notice" | "";

// store
const chat = useChatStore();
const setting = useSettingStore();
const user = useUserStore();

// ref
const chatNewGroupDialogRef = useTemplateRef("chatNewGroupDialogRef");
const searchInputRef = useTemplateRef("searchInputRef");
const noticeInputRef = useTemplateRef("noticeInputRef");
const nameInputRef = useTemplateRef("nameInputRef");

// data
const editFormFieldRaw = ref<EditFormItems>("");
const editFormField = computed<EditFormItems>({
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

const {
  showSearch,
  isTheGroupOwner,
  isNotExistOrNorFriend,
  theContactClone,
  searchUserWord,
  imgList,
  isShowApply,
  isLord,
  theUser,
  vMemberList,
  inputOssFileUploadRef,
  containerProps,
  wrapperProps,
  onSubmitImages,
  toggleImage,
  submitUpdateRoom,
  onScroll,
  scrollTo,
  onMemberContextMenu,
  onExitOrClearGroup,

} = useRoomGroupPopup({
  editFormField,
});
const showAddDialog = ref(false);

// 邀请进群
function showJoinGroup() {
  if (chatNewGroupDialogRef.value) {
    chatNewGroupDialogRef.value?.reload();
    if (chatNewGroupDialogRef.value?.form)
      chatNewGroupDialogRef.value.form.roomId = chat.theContact.roomId;
    showAddDialog.value = true;
  }
};
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
      <div class="rounded-2rem p-1.5" @click="showJoinGroup">
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
    <div relative h-300px>
      <div
        v-if="!chat.currentRoomCache.isReload"
        v-bind="containerProps"
        class="scroll-bar relative !h-300px"
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
            @contextmenu="onMemberContextMenu($event, p.data)"
            @click="setting.isMobileSize && onMemberContextMenu($event, p.data)"
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
</style>
