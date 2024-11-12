<script lang="ts" setup>
import { getApplyUnRead } from "~/composables/api/chat/friend";

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
  const res = await getApplyUnRead(user.getToken);
  if (res.code === StatusCode.SUCCESS)
    applyUnRead.value = res.data.unReadCount;
}


onMounted(() => {
  getApplyCount();
});
onActivated(() => {
  if (user.isLogin)
    getApplyCount();
});
onDeactivated(() => {
  if (user.isLogin)
    getApplyCount();
});
onBeforeUnmount(() => {
  if (user.isLogin)
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
  },
  {
    title: "好友",
    path: "/friend",
    icon: "i-solar:users-group-rounded-line-duotone",
    activeIcon: "i-solar:users-group-rounded-bold-duotone",
    tipValue: computed(() => applyUnRead.value + ws.wsMsgList.applyMsg.length) as { value: number },
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
    icon: "i-solar:user-outline hover:animate-pulse",
    activeIcon: "i-solar:user-bold-duotone hover:animate-pulse",
  },
  {
    title: "更多",
    path: "/more",
    icon: "i-solar-layers-broken ",
    activeIcon: "i-solar-layers-bold-duotone ",
    children: [
      {
        title: "账号",
        path: "/user/safe",
        icon: "i-solar:devices-outline",
        activeIcon: "i-solar:devices-bold-duotone",
      },
      {
        title: "设置",
        path: "/setting",
        icon: "i-solar:settings-linear hover:animate-spin",
        activeIcon: "i-solar:settings-bold-duotone hover:animate-spin",
        tipValue: computed(() => +setting.appUploader.isUpload) as { value: number },
        isDot: true,
      },
    ],
  },
];

interface MenuItem {
  title: string
  path: string
  icon: string
  activeIcon: string
  tipValue?: ComputedRef<number>
  isDot?: boolean
  children?: MenuItem[]
}

// 会话按钮
// const contactShowBtnRef = ref();
// const isStart = ref(false);
// onMounted(() => {
// if (contactShowBtnRef.value) {
//   // 设置按钮位置
//   contactShowBtnRef.value.style.left = `${setting.contactBtnPosition.x}px`;
//   contactShowBtnRef.value.style.top = `${setting.contactBtnPosition.y}px`;
//   moveDom(contactShowBtnRef.value, {
//     startCallback: () => {
//       isStart.value = true;
//     },
//     endCalllback: (x, y) => {
//       setting.contactBtnPosition = { x, y };
//       isStart.value = false;
//     },
//   });
// }
// });
const activeMenu = computed({
  get: () => route.path,
  set: (val) => {
    if (activeMenu.value === "/" && val === "/") {
      setting.isOpenContact = !setting.isOpenContact;
      return;
    }
    if (val === "/more")
      return;
    navigateTo(val);
  },
});
</script>

<template>
  <div>
    <!-- <span
      v-show="$route.path === '/'"
      ref="contactShowBtnRef"
      class="fixed bottom-30 left-2 z-999 h-3rem w-3rem flex-row-c-c rounded-1/2 shadow-lg el-bg-primary hover:shadow-[var(--el-color-primary)]"
    >
      <i
        class="i-solar:chat-square-bold-duotone p-3 color-white"
        @click="() => {
          setting.isOpenContact = !setting.isOpenContact
        }"
      />
    </span> -->
    <div
      class="relative z-998 grid grid-cols-5 border-0 border-t-1px bg-white px-4 py-4 shadow-md border-default dark:bg-dark-8"
    >
      <div v-for="p in menuList" :key="p.path" :index="p.path" class="flex-row-c-c flex-col cursor-pointer gap-2 rounded-2 px-0 py-3 transition-all" :class="{ active: activeMenu === p.path }" @click="activeMenu = p.path">
        <el-badge v-if="!p?.children?.length" :value="p?.tipValue?.value || 0" :hidden="!p?.tipValue?.value" :max="99">
          <i class="p-3" :class="route.path === p.path ? p.activeIcon : p.icon" />
          <span mt-2 block select-none text-center text-3>{{ p.title }}</span>
        </el-badge>
        <el-popover
          v-else
          :width="60"
          :offset="30"
          trigger="click"
        >
          <template #reference>
            <el-badge
              :value="p?.children.reduce((acc, cur) => acc + (cur.tipValue?.value || 0), 0)"
              :hidden="!p?.children.reduce((acc, cur) => acc + (cur.tipValue?.value || 0), 0)"
              :max="99"
              is-dot
            >
              <i class="p-3" :class="route.path === p.path ? p.activeIcon : p.icon" />
              <span mt-2 block select-none text-center text-3>{{ p.title }}</span>
            </el-badge>
          </template>
          <template #default>
            <ul class="flex flex-col gap-3">
              <li v-for="item in p.children" :key="item.path" :index="p.path" class="cursor-pointer px-3 py-2 transition-all card-default" :class="{ active: activeMenu === item.path }" @click="activeMenu = item.path">
                <el-badge :value="item.tipValue?.value || 0" :hidden="!item.tipValue?.value" :max="99" :is-dot="item.isDot" class="flex-row-c-c gap-6">
                  <i class="inline-block p-3" :class="route.path === item.path ? item.activeIcon : item.icon" />
                  <span select-none>{{ item.title }}</span>
                </el-badge>
              </li>
            </ul>
          </template>
        </el-popover>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.active {
  --at-apply: "bg-[var(--el-color-primary)]  text-white shadow-inset shadow-lg";
}
</style>
