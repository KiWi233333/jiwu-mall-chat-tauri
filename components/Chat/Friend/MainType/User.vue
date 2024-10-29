<script setup lang="ts">
/**
 * 用户适配器
 */
const props = defineProps<{
  data: TheFriendOpt<UserType>
}>();
const data = toRef(props.data);
interface UserType {
  id: string
}
const isLoading = ref(true);
const isFrend = ref<boolean | undefined>(false);
const user = ref<Partial<CommUserVO>>({});
const store = useUserStore();

// 加载用户数据
async function loadData(val: string) {
  isFrend.value = false;
  isLoading.value = true;
  try {
    // 确认是否为好友
    await isChatFriend({ uidList: [val] }, store.getToken).then((res) => {
      const data = res.data.checkedList.find(p => p.uid === val);
      isFrend.value = data && data.isFriend === isTrue.TRUE;
    });
    // 获取用户信息
    // 更新用户列表
    if (!val)
      return user.value = {};
    const res = await getCommUserInfoSe(val, store.getToken);
    if (res.code === StatusCode.SUCCESS)
      user.value = res.data;
    isLoading.value = false;
  }
  catch (e) {
    isLoading.value = false;
  }
}
const chat = useChatStore();
const userStore = useUserStore();

// 删除好友
function deleteFriend(userId: string) {
  ElMessageBox.confirm("是否删除该好友？", {
    confirmButtonText: "删除",
    center: true,
    cancelButtonText: "取消",
    lockScroll: false,
    type: "warning",
    callback: async (action: string) => {
      if (action === "confirm") {
        const res = await deleteFriendById(userId, store.getToken);
        if (res.code === StatusCode.SUCCESS) {
          ElNotification.success("删除成功！");
          chat.setTheFriendOpt(FriendOptType.Empty, {});
          chat.setDelUserId(userId);
          chat.setIsAddNewFriend(true);
        }
        chat.setIsAddNewFriend(true);
      }
    },
  });
};

// 好友申请
const isShowApply = ref(false);
const userId = computed(() => {
  return data.value.data.id;
});

// 执行最后一次
watchDebounced(userId, (val: string) => {
  loadData(val);
}, { immediate: true, debounce: 300 });

// 去发消息
async function toSend(uid: string) {
  if (!isFrend.value)
    return;
  const res = await getSelfContactInfoByFriendUid(uid, store.getToken);
  if (!res)
    return;
  if (res && res.code !== StatusCode.SUCCESS)
    return ElMessage.error(res ? res.message : "没有找到对应好友！");
  chat.setContact(res.data);
  nextTick(() => {
    navigateTo({
      path: "/",
    });
  });
}
// @unocss-include
const load = "<i i-tabler:loader p-4></i>";
</script>

<template>
  <div
    v-loading="isLoading"
    element-loading-background="initial"
    :class="{ 'op-100': !isLoading }"
    v-bind="$attrs" h-full w-full flex flex-1 flex-col items-center gap-4 pt-6rem op-0 transition-120 bg-color
  >
    <div flex gap-4>
      <CardElImage
        :src="BaseUrlImg + user.avatar" fit="cover"
        :preview-src-list="[BaseUrlImg + user.avatar]"
        preview-teleported
        loading="lazy"
        class="h-3.8rem w-3.8rem flex-shrink-0 overflow-auto object-cover shadow-sm border-default v-card"
      />
      <div class="text-2.8">
        <strong text-1.4rem>{{ user.nickname }}</strong>
        <p mt-2 op-50>
          ID：{{ userId }}
        </p>
      </div>
    </div>
    <ElDivider style="margin: 1em auto;width: 60%;max-width: 12em" />
    <div v-show="!isLoading">
      <BtnElButton
        v-if="isFrend"
        key="delete"
        icon-class="i-solar:trash-bin-trash-bold-duotone p-2 mr-2"
        class="op-80"
        type="danger"
        plain
        @click="deleteFriend(userId)"
      >
        删除好友&ensp;
      </BtnElButton>
      <BtnElButton
        v-if="isFrend"
        key="send"
        icon-class="i-solar:chat-line-line-duotone p-2 mr-2"
        class="border-default"
        type="info"
        @click="toSend(userId)"
      >
        发消息&ensp;
      </BtnElButton>
      <BtnElButton
        v-else-if="userId !== userStore.userInfo.id"
        key="add"
        icon-class="i-solar:user-plus-bold p-2 mr-2"
        class="op-80"
        type="primary"
        @click="isShowApply = true"
      >
        添加好友&ensp;
      </BtnElButton>
    </div>
    <!-- 好友申请 -->
    <ChatFriendApplyDialog v-model:show="isShowApply" :user-id="userId" @submit="chat.setTheFriendOpt(FriendOptType.Empty, {})" />
  </div>
</template>

<style lang="scss" scoped>
</style>

