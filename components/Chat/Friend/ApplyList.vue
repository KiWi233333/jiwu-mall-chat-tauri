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

// 加载数据
async function loadData() {
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
}


loadData();
// const nowDate = Date.now();
// function getTime(time: string) {
//   return (nowDate - +time) > 24 * 3600
//     ? useDateFormat(time, "YYYY-MM-DD").value.toString()
//     : useDateFormat(time, "HH:mm:ss").value.toString()
//   ;
// }

// 会话store
const chat = useChatStore();
function onArgeeFriend(applyId: number) {
  ElMessageBox.confirm("是否同意好友申请？", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    lockScroll: false,
    callback: async (action: string) => {
      if (action === "confirm") {
        const res = await argeeFriendApply({ applyId }, user.getToken);
        if (res.code === StatusCode.SUCCESS) {
          ElNotification.success("已添加好友！");
          for (const p of list.value) {
            if (p.userId)
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
  <div v-auto-animate w-full flex flex-col>
    <ListAutoIncre
      :immediate="true"
      :auto-stop="true"
      :no-more="pageInfo.isLast"
      :loading="isLoading"
      @load="loadData"
    >
      <div
        v-for="p in list"
        :key="p.applyId" class="mb-3 border-0 border-b-1px pb-3 border-default"
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
            <p cursor-pointer>
              {{ p.user?.nickName || "未填写" }}
            </p>
            <small cursor-pointer>{{ p.msg || "" }}</small>
          </div>
          <div class="ml-a flex-row-c-c flex-shrink-0">
            <el-button v-if="p.status === ChatApplyStatusType.Load" @click="onArgeeFriend(p.applyId)">
              同意
            </el-button>
            <small v-else-if="p.status === ChatApplyStatusType.Argee">已同意</small>
          </div>
        </div>
      </div>
      <template #done>
        <div class="py-1rem text-center op-70">
          {{ list.length ? "没有更多了" : "快去认识其他人" }}
        </div>
      </template>
    </ListAutoIncre>
  </div>
</template>

<style lang="scss" scoped>
.avatar-icon {
  --at-apply:"h-2.6rem card-default  w-2.6rem flex-row-c-c rounded-6px  shadow-sm border-default"
}
.item {
  --at-apply:"flex items-center gap-4 p-2 cursor-pointer rounded-6px mt-2 hover:(bg-[#b8b8b849] ) transition-300";
}
</style>
