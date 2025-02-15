<script lang="ts" setup>
const isLoading = ref<boolean>(false);
const user = useUserStore();
const pageInfo = ref({
  cursor: null as null | string,
  isLast: false,
  size: 10,
  page: 0,
  total: -1,
});
const list = ref<ChatUserFriendApplyVO[]>([]);

const [autoAnimateRef, enable] = useAutoAnimate({});
onMounted(async () => {
  const setting = useSettingStore();
  enable(false);
  await loadData(async () => {
    await nextTick();
    enable(!setting.settingPage.isCloseAllTransition);
  });
});
// 加载数据
async function loadData(call?: () => void) {
  if (isLoading.value || pageInfo.value.isLast)
    return;

  pageInfo.value.page++;
  isLoading.value = true;
  const { data } = await getChatFriendApplyPage(pageInfo.value.page, pageInfo.value.size, user.getToken);
  if (data.records)
    list.value.push(...data.records);
  pageInfo.value.isLast = Boolean(data.isLast);
  pageInfo.value.page = data.current || 1;
  isLoading.value = false;
  call && call();
}


// 会话store
const chat = useChatStore();
function onArgeeFriend(applyId: number) {
  ElMessageBox.confirm("是否同意好友申请？", {
    title: "新好友",
    type: "info",
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    lockScroll: false,
    center: true,
    callback: async (action: string) => {
      if (action === "confirm") {
        const res = await argeeFriendApply({ applyId }, user.getToken);
        if (res.code === StatusCode.SUCCESS) {
          ElNotification.success("已添加好友！");
          for (const p of list.value) {
            if (p.userId && p.applyId === applyId)
              p.status = ChatApplyStatusType.Argee;
          }
          chat.setIsAddNewFriend(true);
        }

        else { ElMessage.error(res.message); }
      }
    },
  });
}
</script>

<template>
  <div ref="autoAnimateRef" class="list w-full flex flex-col px-2 text-sm">
    <ListAutoIncre
      :immediate="true"
      :auto-stop="true"
      :no-more="pageInfo.isLast"
      @load="loadData"
    >
      <div
        v-for="p in list"
        :key="p.applyId"
        class="item-bg mb-2 pb-2 border-default-b"
      >
        <div class="item">
          <div
            class="avatar-icon cursor-pointer"
            @click="chat.setTheFriendOpt(FriendOptType.User, {
              id: p.userId,
            })"
          >
            <CardElImage class="h-full w-full overflow-hidden rounded-6px" :src="BaseUrlImg + p.user?.avatar" fit="cover" />
          </div>
          <div class="flex flex-col truncate">
            <p cursor-pointer text-sm>
              {{ p.user?.nickName || "未填写" }}
            </p>
            <small mt-1 cursor-pointer text-mini>{{ p.msg || "" }}</small>
          </div>
          <div class="ml-a flex-row-c-c flex-shrink-0">
            <el-button v-if="p.status === ChatApplyStatusType.Load" size="small" @click="onArgeeFriend(p.applyId)">
              同意
            </el-button>
            <small v-else-if="p.status === ChatApplyStatusType.Argee">已同意</small>
          </div>
        </div>
      </div>
      <template #done>
        <div class="py-1rem text-center text-mini">
          {{ list.length ? "没有更多了" : "快去认识其他人" }}
        </div>
      </template>
    </ListAutoIncre>
  </div>
</template>

<style lang="scss" scoped>
.avatar-icon {
  --at-apply: "h-2.4rem card-default w-2.4rem flex-row-c-c rounded-6px shadow-sm";
}
.item {
  --at-apply: "card-default flex items-center gap-4 p-3 cursor-pointer rounded-6px hover:(dark:bg-color-3 bg-color shadow) transition-200";
}
</style>
