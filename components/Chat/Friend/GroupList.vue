<script lang="ts" setup>
interface Props {
  type: "friend" | "group"
  immediate?: boolean
  autoStop?: boolean
}
type DataVO = { type: "friend"; data: ChatUserFriendVO } | { type: "group"; data: ChatRoomGroupVO };

const props = withDefaults(defineProps<Props>(), {
  immediate: true,
  autoStop: true,
});

const isLoading = ref<boolean>(false);
const chat = useChatStore();
const user = useUserStore();

const pageInfo = ref({
  cursor: null as null | string,
  isLast: false,
  size: 10,
});
const list = ref<ChatUserFriendVO[] | ChatRoomGroupVO[]>([]);
const isReload = ref(true);

// 加载数据
async function loadData() {
  if (isLoading.value || pageInfo.value.isLast)
    return;
  isLoading.value = true;
  try {
    const { data } = props.type === "friend"
      ? await getChatFriendPage(pageInfo.value.size, pageInfo.value.cursor, user.getToken)
      : await getChatGroupRoomPage(pageInfo.value.size, pageInfo.value.cursor, user.getToken);

    if (data?.list)
      list.value.push(...data.list as any[]);
    pageInfo.value.isLast = data.isLast;
    pageInfo.value.cursor = data.cursor;
  }
  catch (e) {
    console.error(e);
  }
  finally {
    isLoading.value = false;
    isReload.value = false;
  }
}

// 重新加载数据
async function reloadData() {
  pageInfo.value.cursor = null;
  pageInfo.value.isLast = false;
  list.value = [];
  await loadData();
}


// 好友相关监听
if (props.type === "friend") {
  watch(() => chat.isAddNewFriend, (val) => {
    if (val && !isLoading.value) {
      reloadData();
      chat.isAddNewFriend = false;
    }
  });
}

// 群组相关监听
if (props.type === "group") {
  watchDebounced(() => chat.delGroupId, (val) => {
    if (val) {
      list.value = list.value.filter(p => (p as ChatRoomGroupVO).roomId !== val) as ChatRoomGroupVO[];
      chat.setDelGroupId(undefined);
    }
  });
}
else if (props.type === "friend") {
  watch(() => chat.delUserId, (val) => {
    if (val) {
      list.value = list.value.filter(p => (p as ChatUserFriendVO).userId !== val) as ChatUserFriendVO[];
      chat.setDelUserId("");
    }
  });
}

// 首次加载动画
const isFirstLoad = ref(false);
const isFriendPanel = computed(() => props.type === "friend");
onMounted(() => {
  loadData();
  isFirstLoad.value = true;
});
onUnmounted(() => {
  isFirstLoad.value = false;
});
onDeactivated(() => {
  isFirstLoad.value = false;
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
      <!-- 骨架屏
      <div v-if="isReload" class="animate-(fade-in duration-200)">
        <div v-for="p in 2" :key="p" class="item">
          <div class="avatar-icon !bg-skeleton" />
          <span class="bg-skeleton h-1.2em w-8em rounded-4px" />
        </div>
      </div> -->
      <div
        v-for="p in list"
        :key="p.id"
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
      </div>
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
</style>
