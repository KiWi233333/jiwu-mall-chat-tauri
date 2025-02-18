<script lang="ts" setup>
const isLoading = ref<boolean>(false);
const isReload = ref<boolean>(false);
const user = useUserStore();
const pageInfo = ref({
  cursor: null as null | string,
  isLast: false,
  size: 10,
  page: 0,
  total: -1,
});
const list = ref<ChatUserFriendApplyVO[]>([]);

onMounted(async () => {
  isReload.value = true;
  await loadData(() => {
    nextTick(() => {
      isReload.value = false;
    });
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
          for (const p of list.value) {
            if (p.userId && p.applyId === applyId)
              p.status = ChatApplyStatusType.Argee;
          }
          chat.setIsAddNewFriend(true);
        }
      }
    },
  });
}
</script>

<template>
  <div class="list w-full flex flex-col animate-(fade-in duration-200) px-2 text-sm">
    <!-- 骨架屏 -->
    <div v-if="isReload">
      <div v-for="p in 10" :key="p" class="item">
        <div class="h-2.4rem w-2.4rem flex-shrink-0 rounded bg-gray-1 object-cover dark:bg-dark-4" />
        <div>
          <div class="h-3 w-8em rounded bg-gray-1 dark:bg-dark-4" />
          <div class="mt-2 h-3 w-4em rounded bg-gray-1 dark:bg-dark-4" />
        </div>
        <div class="ml-a h-4 w-3em rounded bg-gray-1 dark:bg-dark-4" />
      </div>
    </div>
    <ListAutoIncre
      :immediate="false"
      :auto-stop="true"
      :no-more="pageInfo.isLast"
      @load="loadData"
    >
      <div
        v-for="p in list" :key="p.applyId"
        class="item"
      >
        <CardElImage
          class="avatar-icon cursor-pointer"
          :src="BaseUrlImg + p.user?.avatar" fit="cover" @click="chat.setTheFriendOpt(FriendOptType.User, {
            id: p.userId,
          })"
        />

        <div class="flex flex-col truncate">
          <p truncate text-sm>
            {{ p.user?.nickName || "未填写" }}
          </p>
          <small mt-1 cursor-pointer text-mini>留言：{{ p.msg || "" }}&nbsp;
            <span v-if="p.createTime" class="text-mini">{{ formatContactDate(p.createTime) }}</span>
          </small>
        </div>
        <div class="ml-a flex-row-c-c flex-shrink-0">
          <el-button v-if="p.status === ChatApplyStatusType.Load" size="small" @click="onArgeeFriend(p.applyId)">
            同意
          </el-button>
          <small v-else-if="p.status === ChatApplyStatusType.Argee">已同意</small>
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
  --at-apply: "h-2.4rem bg-color-2 overflow-hidden rounded-full w-2.4rem flex-row-c-c  shadow-sm";
}
.item {
  --at-apply: "card-default flex items-center gap-4 p-4 cursor-pointer rounded-6px hover:(!bg-color-3 shadow) transition-200 mb-4";
}
</style>
