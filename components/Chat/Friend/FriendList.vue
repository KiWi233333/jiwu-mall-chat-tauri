<script lang="ts" setup>
const isLoading = ref<boolean>(false);
const user = useUserStore();
const pageInfo = ref({
  cursor: null as null | string,
  isLast: false,
  size: 10,
  total: -1,
});
const list = ref<ChatUserFriendVO[]>([]);

// 加载数据
async function loadData() {
  if (isLoading.value || pageInfo.value.isLast)
    return;
  isLoading.value = true;
  const { data } = await getChatFriendPage(pageInfo.value.size, pageInfo.value.cursor, user.getToken);
  if (data.list)
    list.value.push(...data.list);
  pageInfo.value.isLast = data.isLast;
  pageInfo.value.cursor = data.cursor;
  isLoading.value = false;
}
loadData();


// 会话store
const chat = useChatStore();
watch(() => chat.isAddNewFriend, (val) => {
  if (val && !isLoading.value) {
    reloadData();
    chat.isAddNewFriend = false;
  }
});
function reloadData() {
  pageInfo.value.cursor = null;
  pageInfo.value.isLast = false;
  list.value = [];
  loadData();
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
        :key="p.id" class="item"
        @click="chat.setTheFriendOpt(FriendOptType.User, {
          id: p.userId,
        })"
      >
        <div class="avatar-icon">
          <CardElImage class="h-full w-full overflow-hidden rounded-6px" :src="BaseUrlImg + p.avatar" fit="cover" />
        </div>
        <small>{{ p.nickName || "未填写" }}</small>
      </div>
    </ListAutoIncre>
  </div>
</template>

<style lang="scss" scoped>
.avatar-icon {
  --at-apply:"h-2.6rem card-default  w-2.6rem flex-row-c-c rounded-6px  shadow-sm border-default"
}
.item {
  --at-apply:"flex items-center gap-4 p-2 cursor-pointer rounded-6px mt-2 hover:(bg-[#b8b8b849] ) transition-300"
}
</style>
