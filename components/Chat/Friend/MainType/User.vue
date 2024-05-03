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
const isLoading = ref(false);
const isFrend = ref<boolean | undefined>(false);
const user = ref<Partial<CommUserVO>>({});
const store = useUserStore();

// 加载用户数据
async function loadData(val: string) {
  if (isLoading.value)
    return;
  isFrend.value = false;
  isLoading.value = true;
  // 获取用户信息
  const res = await getCommUserInfoSe(val, store.getToken);
  if (res.code === StatusCode.SUCCESS)
    user.value = res.data;
  isLoading.value = false;
  // 确认是否为好友
  isChatFriend({ uidList: [val] }, store.getToken).then((res) => {
    const data = res.data.checkedList.find(p => p.uid === val);
    isFrend.value = data && data.isFriend === isTrue.TRUE;
  }).catch(() => {

  });
}
const chat = useChatStore();

// 删除好友
function deleteFriend(userId: string) {
  ElMessageBox.confirm("是否删除该好友？", {
    confirmButtonText: "删除",
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

watch(userId, (val) => {
  if (val)
    loadData(val);
}, {
  immediate: true,
  deep: true,
});


// 去发消息
async function toSend(uid: string) {
  if (!isFrend.value)
    return;
  const res = await getChatContactInfo(uid, RoomType.SELFT, store.getToken);
  if (!res)
    return;
  if (res && res.code !== StatusCode.SUCCESS)
    return ElMessage.error(res ? res.message : "没有找到对应好友！");
  chat.setContact(res.data);
  nextTick(() => {
    navigateTo({
      path: "/chat",
    });
  });
}
// @unocss-include
const load = "i-tabler:loader";
</script>

<template>
  <div
    v-loading="isLoading"
    element-loading-text="加载中..." element-loading-background="rgba(0, 0, 0, 0)"
  >
    <div
      v-show="!isLoading"
      class="animate-[0.3s_fade-in]"
      v-bind="$attrs" h-full w-full flex flex-1 flex-col items-center gap-1rem pt-6rem bg-color
    >
      <div
        flex gap-4
      >
        <CardElImage
          :src="BaseUrlImg + user.avatar" fit="cover"
          class="h-3.8rem w-3.8rem flex-shrink-0 overflow-auto object-cover shadow-sm border-default v-card"
        />
        <div class="text-0.8rem leading-1.5em">
          <strong text-1.4rem>{{ user.nickname }}</strong>
          <p op-60>
            ID：{{ userId }}
            {{ user.gender || "" }}
          </p>
          <p op-60>
            邮箱：{{ user.email || "未填写" }}
          </p>
        </div>
      </div>
      <ElDivider style="margin: 2rem auto;width: 30%;" />
      <div>
        <BtnElButton
          v-if="isFrend"
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
          icon-class="i-solar:chat-line-line-duotone p-2 mr-2"
          class="border-default"
          type="info"
          @click="toSend(userId)"
        >
          发消息&ensp;
        </BtnElButton>
        <BtnElButton
          v-else
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
  </div>
</template>

<style lang="scss" scoped>
</style>

