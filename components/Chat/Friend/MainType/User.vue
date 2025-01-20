<script setup lang="ts">
import { dayjs } from "element-plus";

/**
 * 用户适配器
 */
const {
  data: panelData,
} = defineProps<{
  data: TheFriendOpt<UserType>
}>();
interface UserType {
  id: string
}
const store = useUserStore();
const isLoading = ref(true);
const isFrend = ref<boolean | undefined>(false);
const userId = computed(() => panelData.data.id);
const targetUserInfo = ref<Partial<CommUserVO>>({});
const getAgeText = computed(() => {
  if (!targetUserInfo.value?.birthday) {
    return "未知";
  }
  return `${dayjs().diff(dayjs(targetUserInfo.value.birthday), "years")}岁`;
});
// 星座
const getConstellation = computed(() => {
  if (!targetUserInfo.value?.birthday) {
    return "未知";
  }
  const date = dayjs(targetUserInfo.value.birthday);
  const month = date.month() + 1;
  const day = date.date();
  const constellationArr = [
    "摩羯座",
    "水瓶座",
    "双鱼座",
    "白羊座",
    "金牛座",
    "双子座",
    "巨蟹座",
    "狮子座",
    "处女座",
    "天秤座",
    "天蝎座",
    "射手座",
  ];
  const constellation = constellationArr[
    (month * 10 + day) % 12
  ];
  return constellation;
});
// 生日还有xx天
const getBirthdayCount = computed(() => {
  if (!targetUserInfo.value?.birthday)
    return undefined;
  const today = dayjs(); // 当前日期
  const birthDay = dayjs(targetUserInfo.value?.birthday); // 生日日期
  const thisYearBirthday = birthDay.set("year", today.year());
  let nextBirthday = thisYearBirthday;
  if (today.isAfter(thisYearBirthday)) {
    nextBirthday = birthDay.set("year", today.year() + 1);
  }
  return nextBirthday.diff(today, "day");
});


// 加载用户数据
async function loadData(val: string) {
  isFrend.value = false;
  isLoading.value = true;
  try {
    // 确认是否为好友
    await isChatFriend({ uidList: [val] }, store.getToken).then((res) => {
      const data = res.data.checkedList.find((p: FriendCheck) => p.uid === val);
      isFrend.value = data && data.isFriend === isTrue.TRUE;
    });
    if (!val)
      return targetUserInfo.value = {};
    const res = await getCommUserInfoSe(val, store.getToken);
    if (res.code === StatusCode.SUCCESS)
      targetUserInfo.value = res.data;
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
    title: "删除提示",
    type: "warning",
    confirmButtonText: "删除",
    confirmButtonClass: "el-button--danger",
    center: true,
    cancelButtonText: "取消",
    lockScroll: false,
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
// 执行最后一次
watch(userId, (val: string) => {
  loadData(val);
}, { immediate: true });

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
const loadingIcon = `
<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M12 4.5a7.5 7.5 0 1 0 0 15a7.5 7.5 0 0 0 0-15M1.5 12C1.5 6.201 6.201 1.5 12 1.5S22.5 6.201 22.5 12S17.799 22.5 12 22.5S1.5 17.799 1.5 12" opacity=".1"/><path fill="currentColor" d="M12 4.5a7.46 7.46 0 0 0-5.187 2.083a1.5 1.5 0 0 1-2.075-2.166A10.46 10.46 0 0 1 12 1.5a1.5 1.5 0 0 1 0 3"/></g></svg>
`;
</script>

<template>
  <div
    v-loading="isLoading"
    element-loading-text="加载中..."
    :element-loading-spinner="loadingIcon"
    element-loading-background="transparent"
    :class="{ 'op-100': !isLoading }"
    v-bind="$attrs"
    class="h-full w-full flex flex-1 flex-col gap-6 px-10 pt-18 op-0 transition-120 bg-color sm:px-1/4"
  >
    <!-- 信息 -->
    <div flex gap-4 pb-6 border-default-b>
      <CardElImage
        :src="BaseUrlImg + targetUserInfo.avatar" fit="cover"
        :preview-src-list="[BaseUrlImg + targetUserInfo.avatar]"
        preview-teleported
        loading="lazy"
        class="h-4.6rem w-4.6rem flex-shrink-0 overflow-auto object-cover shadow-sm sm:(h-5rem w-5rem) border-default v-card"
      />
      <div flex flex-col py-1>
        <strong truncate text-1.4rem>{{ targetUserInfo.nickname }}</strong>
        <p mt-a truncate text-mini :title="userId">
          ID：{{ userId }}
        </p>
        <p v-if="isFrend" mt-2 truncate text-mini :title="targetUserInfo.email">
          邮箱：{{ targetUserInfo.email || ' - ' }}
        </p>
      </div>
    </div>
    <!-- 详情 -->
    <div gap-6 pb-6 border-default-b>
      <p truncate text-sm>
        <i mr-3 p-2 :class="targetUserInfo.gender === Gender.BOY ? 'i-tabler:gender-male text-blue' : targetUserInfo.gender === Gender.GIRL ? 'i-tabler:gender-female text-pink' : 'i-tabler:gender-transgender text-yellow'" />
        <span class="mr-2 pr-2 border-default-r">
          {{ targetUserInfo.gender }}
        </span>
        <template v-if="targetUserInfo.birthday">
          <span class="mr-2 pr-2 border-default-r">
            {{ getAgeText }}
          </span>
          <span class="mr-2 pr-2 border-default-r">
            {{ targetUserInfo.birthday || ' - ' }}
          </span>
          <span>
            {{ getConstellation }}
          </span>
        </template>
      </p>
      <p mt-6 truncate text-sm>
        <i class="i-carbon:send mr-3 p-2" />
        签名：-
      </p>
      <p mt-6 truncate text-sm>
        <i class="i-tabler:calendar mr-3 p-2" />
        好友生日还有：{{ getBirthdayCount || ' - ' }}天
      </p>
      <p v-if="isFrend" mt-6 truncate text-sm>
        <i class="i-carbon:phone-incoming mr-3 p-2" />
        手机号：-
      </p>
      <p mt-6 truncate text-small>
        <i class="i-carbon:user mr-3 p-2" />
        上次在线：
        {{ targetUserInfo.lastLoginTime || ' - ' }}
      </p>
    </div>
    <!-- 按钮 -->
    <div v-show="!isLoading" class="mx-a">
      <BtnElButton
        v-if="isFrend"
        key="delete"
        icon-class="i-solar:trash-bin-trash-outline p-2 mr-2"
        style="transition: .2s; max-width: 9em;text-align: center;letter-spacing: 1px;--el-color-primary: var(--el-color-danger);"
        plain
        class="mr-4 op-60 hover:op-100"
        @click="deleteFriend(userId)"
      >
        删除好友&ensp;
      </BtnElButton>
      <BtnElButton
        v-if="isFrend"
        key="send"
        icon-class="i-solar:chat-line-bold p-2 mr-2"
        style="transition: .2s; max-width: 9em;text-align: center;letter-spacing: 1px;"
        type="success"
        @click="toSend(userId)"
      >
        发送消息&ensp;
      </BtnElButton>
      <BtnElButton
        v-else-if="userId !== userStore.userInfo.id"
        key="add"
        icon-class="i-solar:user-plus-bold p-2 mr-2"
        type="primary"
        @click="isShowApply = true"
      >
        添加好友&ensp;
      </BtnElButton>
    </div>
    <!-- 好友申请 -->
    <ChatFriendApplyDialog v-model:show="isShowApply" :target-user-info-id="userId" @submit="chat.setTheFriendOpt(FriendOptType.Empty, {})" />
  </div>
</template>

<style lang="scss" scoped>
</style>

