<script lang="ts" setup>
interface Props {
  type: "friend" | "group"
  immediate?: boolean
  autoStop?: boolean
}
//  { type: "friend"; data: ChatUserFriendVO } | { type: "group"; data: ChatRoomGroupVO };
// 根据type判断数据类型
type DataVO = ChatUserFriendVO | ChatRoomGroupVO;

const props = withDefaults(defineProps<Props>(), {
  immediate: true,
  autoStop: true,
});

const isLoading = ref<boolean>(false);
const lastLoadTime = ref<number>();
const chat = useChatStore();
const user = useUserStore();

const pageInfo = ref({
  cursor: undefined as undefined | string,
  isLast: false,
  size: 10,
});
const list = ref<DataVO[]>([]);
const isReload = ref(true);

// 加载数据
async function loadData() {
  if (isLoading.value || pageInfo.value.isLast)
    return;
  isLoading.value = true;
  try {
    const { data } = props.type === "friend"
      ? await getChatFriendPage(pageInfo.value.size, pageInfo.value.cursor || null, user.getToken)
      : await getChatGroupRoomPage(pageInfo.value.size, pageInfo.value.cursor || null, user.getToken);

    if (data?.list)
      list.value.push(...data.list as any[]);
    pageInfo.value.isLast = data.isLast;
    pageInfo.value.cursor = data.cursor || undefined;
  }
  catch (e) {
    console.error(e);
  }
  finally {
    isLoading.value = false;
  }
}

// 重新加载数据
async function reloadData() {
  pageInfo.value.cursor = undefined;
  pageInfo.value.isLast = false;
  lastLoadTime.value = Date.now();
  list.value = [];
  isReload.value = true;
  await loadData();
  nextTick(() => {
    isReload.value = false;
  });
}


// 好友相关监听
if (props.type === "friend") {
  watch(() => chat.isAddNewFriend, (val) => {
    if (val && !isLoading.value) {
      reloadData();
      chat.isAddNewFriend = false;
    }
  });
  watch(() => chat.delUserId, (val) => {
    if (val) {
      list.value = list.value.filter(p => (p as ChatUserFriendVO).userId !== val) as ChatUserFriendVO[];
      chat.setDelUserId("");
    }
  });
}
else if (props.type === "group") { // 群组相关监听
  watchDebounced(() => chat.delGroupId, (val) => {
    if (val) {
      list.value = list.value.filter(p => (p as ChatRoomGroupVO).roomId !== val) as ChatRoomGroupVO[];
      chat.setDelGroupId(undefined);
    }
  });
}
// 首次加载动画
const isFirstLoad = ref(false);
const isFriendPanel = computed(() => props.type === "friend");
onMounted(() => {
  reloadData();
  isFirstLoad.value = true;
});
onUnmounted(() => {
  isFirstLoad.value = false;
});
onDeactivated(() => {
  isFirstLoad.value = false;
});

// 页面激活 5分钟内不重新加载
onActivated(() => {
  if (lastLoadTime.value && Date.now() - lastLoadTime.value > 1000 * 60 * 5) { // 5分钟内不再加载
    reloadData();
  }
});
</script>

<template>
  <div
    :class="{ 'animate-(fade-in duration-200)': isFirstLoad }"
  >
    <ListAutoIncre
      :immediate="immediate"
      :auto-stop="autoStop"
      :no-more="pageInfo.isLast"
      loading-class="op-0"
      @load="loadData"
    >
      <!-- 骨架屏 -->
      <div v-if="isReload" class="animate-(fade-in duration-200)">
        <div v-for="p in 4" :key="p" class="item">
          <div class="h-2.4rem w-2.4rem flex-shrink-0 rounded bg-gray-1 object-cover dark:bg-dark-4" />
          <div class="nickname-skeleton h-4 w-8em rounded bg-gray-1 dark:bg-dark-4" />
        </div>
      </div>
      <template v-else>
        <div
          v-for="p in list"
          :key="p.id"
          v-memo="[]"
          class="item"
          :class="{ focus: (isFriendPanel ? chat.theFriendOpt?.data?.id === (p as ChatUserFriendVO).userId : chat.theFriendOpt?.data?.roomId === p.roomId) }"
          @click="chat.setTheFriendOpt(
            isFriendPanel ? FriendOptType.User : FriendOptType.Group,
            isFriendPanel ? { id: (p as ChatUserFriendVO).userId } : p,
          )"
        >
          <CardElImage
            class="avatar-icon overflow-hidden rounded-6px"
            :src="BaseUrlImg + p.avatar"
            fit="cover"
          />
          <span>{{ isFriendPanel ? (p as ChatUserFriendVO).nickName : (p as ChatRoomGroupVO).name || '未填写' }}</span>
          <svg
            v-if="(p as ChatUserFriendVO).type === UserType.ROBOT"
            title="机器人"
            xmlns="http://www.w3.org/2000/svg" class="ai-icon" viewBox="0 0 24 24"
          ><path fill="currentColor" d="M13.5 2c0 .444-.193.843-.5 1.118V5h5a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h5V3.118A1.5 1.5 0 1 1 13.5 2M6 7a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1zm-4 3H0v6h2zm20 0h2v6h-2zM9 14.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3m6 0a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3" /></svg>
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
  --at-apply: "flex items-center gap-4 p-2 cursor-pointer rounded-6px mt-2 hover:(bg-menu-color) ";
  &.focus {
    --at-apply: "bg-menu-color";
  }
}

.ai-icon {
  --at-apply: "h-1.4em w-1.4em text-theme-primary dark:text-theme-info";
}
</style>
