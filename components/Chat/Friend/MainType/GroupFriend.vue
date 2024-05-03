<script setup lang="ts">
/**
 * 群聊适配器
 */
const props = defineProps<{
  data: TheFriendOpt<ChatContactVO>
}>();
const data = toRef(props.data);
const isLoading = ref(false);
const isOnGroup = ref<boolean | undefined>(false);
const room = ref<Partial<ChatRoomInfoVO>>({});
const store = useUserStore();

// 加载房间数据
async function loadData(val: number) {
  if (isLoading.value)
    return;
  isOnGroup.value = false;
  isLoading.value = true;
  // 获取房间信息
  const res = await getRoomGroupInfo(val, store.getToken);
  if (res.code === StatusCode.SUCCESS)
    room.value = res.data;
  isLoading.value = false;
  // 确认是否为在群
  isOnGroup.value = true; // 假设用户已经在群中，根据实际情况进行判断
}
const chat = useChatStore();

// 退出群聊
function exitRoom(roomId: number) {
  ElMessageBox.confirm("是否退出该群聊？", {
    confirmButtonText: "退出",
    cancelButtonText: "取消",
    lockScroll: false,
    type: "warning",
    callback: async (action: string) => {
      if (action === "confirm") {
        const res = await exitRoomGroup(roomId, store.getToken);
        if (res.code === StatusCode.SUCCESS) {
          ElNotification.success("退出成功！");
          chat.setTheFriendOpt(FriendOptType.Empty, {});
        }
      }
    },
  });
};

// 群聊申请
const isShowApply = ref(false);
const roomId = computed(() => {
  return data.value.data.roomId;
});
watch(roomId, val => loadData(val), { immediate: true });


// 去发消息
async function toSend(roomId: number) {
  if (!isOnGroup.value)
    return;
  const res = await getChatContactInfo(roomId, RoomType.GROUP, store.getToken);
  if (!res)
    return;
  if (res && res.code !== StatusCode.SUCCESS)
    return ElMessage.error(res ? res.message : "没有找到对应群聊！");
  chat.setContact(res.data);
  nextTick(() => {
    navigateTo({
      path: "/chat",
    });
  });
}
</script>

<template>
  <div
    v-loading="isLoading"
    element-loading-text="加载中..." element-loading-background="rgba(0, 0, 0, 0)"
  >
    <div
      v-show="!isLoading"
      class="animate-[0.3s_fade-in]"
      v-bind="$attrs" h-full w-full flex-1 gap-1rem p-4 bg-color
    >
      <!-- 顶部 -->
      <div
        flex items-center gap-4 p-2
      >
        <CardElImage
          :src="BaseUrlImg + data.data.avatar" fit="cover"
          class="h-2.4rem w-2.4rem flex-shrink-0 overflow-auto object-cover shadow-sm border-default v-card"
        />
        <strong text-1rem>{{ room.groupName }}</strong>
        <small op-60 el-color-info>在线：{{ room.onlineNum || "0" }}</small>
      </div>
      <!-- 群成员 -->
      <ChatRoomGroupGrid class="max-h-50vh" :data="data.data" />
      <ElDivider style="margin: 1rem auto;width: 30%;" />
      <!-- 按钮 -->
      <div flex-row-c-c py-4>
        <BtnElButton
          v-if="isOnGroup"
          icon-class="i-solar:exit-outline p-2 mr-2"
          class="op-80"
          type="danger"
          plain
          @click="exitRoom(roomId)"
        >
          退出&ensp;
        </BtnElButton>
        <BtnElButton
          v-if="isOnGroup"
          icon-class="i-solar:chat-line-line-duotone p-2 mr-2"
          class="border-default"
          type="info"
          @click="toSend(roomId)"
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
          添加群聊&ensp;
        </BtnElButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
</style>

