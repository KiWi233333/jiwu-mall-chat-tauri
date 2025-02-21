<script lang="ts" setup>
// 会话store
const user = useUserStore();
const store = useUserStore();
const chat = useChatStore();

// 机器人列表
const isReload = ref<boolean>(false);
const list = ref<RobotUserVO[]>([]);
const isLoading = ref<boolean>(false);
const isLoadRobot = ref<string>("");

// 加载数据
async function loadData(call?: () => void) {
  if (isLoading.value)
    return;
  isLoading.value = true;
  const { data } = await getAiRobotList(user.getToken, isTrue.TRUE);
  if (data)
    list.value.push(...data);
  isLoading.value = false;
  call && call();
}

// 添加机器人
function onHandelRobot(robot: RobotUserVO) {
  const { userId } = robot;
  if (robot.isFriend === isTrue.TRUE) {
    chat.toContactSendMsg("userId", userId);
    isLoadRobot.value = userId;
    return;
  }
  ElMessageBox.confirm("是否添加该 AI ？", {
    title: "操作提示",
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    lockScroll: false,
    center: true,
    callback: async (action: string) => {
      if (action === "confirm") {
        // 确认是否为好友
        isChatFriend({ uidList: [userId] }, user.getToken).then(async (fRes) => {
          if (fRes.code !== StatusCode.SUCCESS)
            return ElMessage.error(fRes.msg || "申请失败，请稍后再试！");
          const user = fRes.data.checkedList.find((p: FriendCheck) => p.uid === userId);
          if (user && user.isFriend)
            return ElMessage.warning("申请失败，该机器人已添加过！");
          // 开启申请
          const res = await addFriendApply({
            msg: `我是 ${store?.userInfo?.nickname}`,
            targetUid: userId,
          }, store.getToken);
          if (res.code !== StatusCode.SUCCESS)
            return;
          const item = list.value.find(p => p.userId === userId);
          if (item) {
            item.isFriend = isTrue.TRUE;
          }
          // ElMessage.success("添加成功，快去对话吧！");
          const load = ElLoading.service({
            lock: true,
            text: "添加成功，正在前往对话中...",
            background: "rgba(0, 0, 0, 0.1)",
          });
          setTimeout(() => {
            onHandelRobot(robot);
            load.close();
          }, 1000);
        }).catch(() => {
        });
      }
    },
  });
}

// 初始化
onMounted(async () => {
  isReload.value = true;
  await loadData(() => {
    nextTick(() => {
      isReload.value = false;
    });
  });
});
onDeactivated(() => {
  isLoadRobot.value = "";
});
</script>

<template>
  <div class="list">
    <!-- 骨架屏 -->
    <template v-if="isReload">
      <div v-for="p in 6" :key="p" class="item">
        <div class="h-3rem w-3rem flex-shrink-0 rounded-1/2 bg-gray-1 object-cover sm:(h-3.5rem w-3.5rem) dark:bg-dark-4" />
        <div>
          <div class="h-3 w-8em bg-gray-1 dark:bg-dark-4" />
          <div class="mt-2 h-3 w-4em rounded bg-gray-1 dark:bg-dark-4" />
        </div>
        <div class="ml-a h-4 w-3em rounded bg-gray-1 dark:bg-dark-4" />
      </div>
    </template>
    <div
      v-for="p in list" :key="p.userId"
      class="item"
      title="开始对话"
      @click.stop="onHandelRobot(p)"
    >
      <CardElImage
        v-loading="isLoadRobot === p.userId"
        class="avatar-icon" :src="BaseUrlImg + p?.avatar"
        fit="cover"
        title="点击查看详情"
        element-loading-text="加载中..."
        element-loading-background="transparent"
        :element-loading-spinner="defaultLoadingIcon"
      />
      <div>
        <p truncate text-sm>
          {{ p?.nickname || "未填写" }}
        </p>
        <p class="text-overflow-3 mt-2 max-h-4em text-mini" :title="p.description || ''">
          {{ p.description || "" }}
        </p>
      </div>
    </div>
    <div
      v-if="!isReload"
      class="grid-col-[1/-1] text-center text-mini"
    >
      {{ list.length ? "没有更多了" : "快去添加你的专属AI吧" }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.list {
  --at-apply: "grid cols-1 flex-col gap-3 text-sm";
}
@media (min-width: 640px) {
  .list {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}
.item {
  --at-apply: "card-default flex items-center gap-4 p-4 cursor-pointer rounded-2 hover:(scale-102 shadow)  transition-200";

  .avatar-icon {
    --at-apply: "border-(2px solid light) cursor-pointer flex-shrink-0 h-3rem w-3rem sm:(w-3.5rem h-3.5rem) card-bg-color-2  rounded-1/2 flex-row-c-c  ";
    box-shadow: rgba(172, 172, 172, 0.3) 0px 0px 5px;
  }
}
</style>
