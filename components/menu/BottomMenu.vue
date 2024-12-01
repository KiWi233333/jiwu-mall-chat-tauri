<script lang="ts" setup>
defineEmits<{
  (e: "close"): void
}>();
// 路由
const route = useRoute();
const user = useUserStore();
const ws = useWs();
const setting = useSettingStore();
const chat = useChatStore();
const applyUnRead = ref(0);
/**
 * 获取好友申请数量 (未读)
 */
async function getApplyCount() {
  if (!user.getTokenFn() || !setting.isMobileSize)
    return;
  const res = await getApplyUnRead(user.getToken);
  if (res.code === StatusCode.SUCCESS)
    applyUnRead.value = res.data.unReadCount;
}

onMounted(() => {
  getApplyCount();
});
onActivated(() => {
  getApplyCount();
});
onDeactivated(() => {
  getApplyCount();
});
onBeforeUnmount(() => {
  getApplyCount();
});

// @unocss-include
const menuList = [
  {
    title: "聊天",
    path: "/",
    icon: "i-solar:chat-line-broken",
    activeIcon: "i-solar:chat-line-bold-duotone",
    // tipValue: computed(() => ws.wsMsgList.newMsg.length) as { value: number },
    tipValue: computed(() => chat.unReadContactList.reduce((acc, cur) => acc + cur.unreadCount, 0)),
    isDot: false,
  },
  {
    title: "好友",
    path: "/friend",
    icon: "i-solar:users-group-rounded-line-duotone",
    activeIcon: "i-solar:users-group-rounded-bold-duotone",
    tipValue: computed(() => applyUnRead.value + ws.wsMsgList.applyMsg.length) as { value: number },
    isDot: false,
  },
  {
    title: "AI",
    path: "/ai",
    icon: "i-solar:ghost-outline",
    activeIcon: "i-solar:ghost-bold",
  },
  {
    title: "个人",
    path: "/user",
    icon: "i-solar:user-outline",
    activeIcon: "i-solar:user-bold-duotone",
  },
  {
    title: "更多",
    path: "/more",
    icon: "i-solar-layers-broken ",
    activeIcon: "i-solar-layers-bold-duotone ",
    tipValue: computed(() => +setting.appUploader.isUpload),
    children: [
      {
        title: "账号",
        path: "/user/safe",
        icon: "i-solar:devices-outline",
        activeIcon: "i-solar:devices-bold-duotone",
        isDot: true,
      },
      {
        title: "设置",
        path: "/setting",
        icon: "i-solar:settings-linear hover:animate-spin",
        activeIcon: "i-solar:settings-bold-duotone hover:animate-spin",
        tipValue: computed(() => +setting.appUploader.isUpload),
        isDot: true,
      },
    ],
  },
];

const preRoutePath = ref("");
const activeMenu = computed({
  get: () => route.path,
  set: async (val) => {
    if (val === "/more")
      return;
    await navigateTo(val);
  },
});
</script>

<template>
  <div
    class="relative z-998 grid grid-cols-5 select-none justify-center border-0 border-t-1px bg-white shadow-md border-default dark:bg-dark-8"
  >
    <div
      v-for="p in menuList" :key="p.path" :index="p.path" class="item"
      :class="{ active: activeMenu === p.path }"
      @click="activeMenu = p.path"
    >
      <el-badge
        v-if="!p?.children?.length"
        :value="p?.tipValue?.value || 0"
        :hidden="!p?.tipValue?.value"
        :max="99"
        :is-dot="p.isDot"
      >
        <i class="p-3" :class="route.path === p.path ? p.activeIcon : p.icon" />
        <span mt-2 block select-none text-center text-3>{{ p.title }}</span>
      </el-badge>
      <el-popover
        v-else
        :width="30"
        :offset="25"
        trigger="hover"
      >
        <template #reference>
          <el-badge
            :value="p.tipValue?.value || 0"
            :hidden="!p.tipValue.value"
            :max="99"
            class="h-full w-full flex-row-c-c flex-col"
            :is-dot="p.isDot"
          >
            <i class="p-3" :class="route.path === p.path ? p.activeIcon : p.icon" />
            <span mt-2 block select-none text-center text-3>{{ p.title }}</span>
          </el-badge>
        </template>
        <template #default>
          <ul class="grid cols-1 gap-3">
            <el-badge v-for="item in p.children" :key="item.path" :value="item.tipValue?.value || 0" :hidden="!item.tipValue?.value" :max="99" :is-dot="item.isDot" class="flex-row-c-c cursor-pointer gap-6 px-2 py-1" :index="p.path" :class="{ active: activeMenu === item.path }" @click="activeMenu = item.path">
              <i class="inline-block p-3" :class="route.path === item.path ? item.activeIcon : item.icon" />
              <span>{{ item.title }}</span>
            </el-badge>
          </ul>
        </template>
      </el-popover>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.item {
  --at-apply: "flex-row-c-c flex-col cursor-pointer gap-2 rounded-2 py-4 transition-200";
}
.active {
  color: var(--el-color-info);
  filter: drop-shadow(0 0 8px var(--el-color-info));
  transition-property: filter, color;
}
</style>
