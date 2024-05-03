<script lang="ts" setup>
const isLoading = ref<boolean>(false);
const user = useUserStore();
const pageInfo = ref({
  cursor: null as null | string,
  isLast: false,
  size: 10,
  total: -1,
});
const list = ref<ChatContactVO[]>([]);

// 加载数据
async function loadData() {
  if (isLoading.value || pageInfo.value.isLast)
    return;
  isLoading.value = true;
  const { data } = await getChatContactPage({
    pageSize: pageInfo.value.size,
    cursor: pageInfo.value.cursor,
    type: RoomType.GROUP,
  }, user.getToken);
  if (data.list)
    list.value.push(...data.list);
  pageInfo.value.isLast = data.isLast;
  pageInfo.value.cursor = data.cursor;
  isLoading.value = false;
}
loadData();
// 会话store
const chat = useChatStore();

watchDebounced(() => chat.delUserId, (val) => {
  if (val) {
    list.value = list.value.filter(p => p.userId !== val);
    chat.setDelUserId("");
  }
}, {
  debounce: 300,
});
</script>


<template>
  <div w-full flex flex-col>
    <ListAutoIncre
      :no-more="pageInfo.isLast"
      :loading="isLoading"
      @load="loadData"
    >
      <div
        v-for="p in list"
        :key="p.id" class="item" data-fade
        @click="chat.setTheFriendOpt(FriendOptType.GroupFriend, p)"
      >
        <div class="avatar-icon">
          <CardElImage class="h-full w-full overflow-hidden rounded-6px" :src="BaseUrlImg + p.avatar" fit="cover" />
        </div>
        <p>{{ p.name || "未填写" }}</p>
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
