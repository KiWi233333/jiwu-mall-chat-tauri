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

// @unocss-include
const menuList = [
  {
    title: "聊天",
    path: "/",
    icon: "i-solar:chat-line-broken",
    activeIcon: "i-solar:chat-line-bold-duotone",
    tipValue: computed(() => ws.wsMsgList.newMsg.length),
  },
  {
    title: "好友",
    path: "/friend",
    icon: "i-solar:users-group-rounded-line-duotone",
    activeIcon: "i-solar:users-group-rounded-bold-duotone",
    tipValue: computed(() => applyUnRead.value + ws.wsMsgList.applyMsg.length),
  },
  {
    title: "个人",
    path: "/user",
    icon: "i-solar:user-outline hover:animate-pulse",
    activeIcon: "i-solar:user-bold-duotone hover:animate-pulse",
  },
  {
    title: "AI",
    path: "/ai",
    icon: "i-solar:ghost-outline",
    activeIcon: "i-solar:ghost-bold",
  },
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
    tipValue: computed(() => +setting.appUploader.isUpload),
    isDot: true,
  },
];

const contactShowBtnRef = ref();
const isStart = ref(false);
onMounted(() => {
  if (contactShowBtnRef.value) {
    // 设置按钮位置
    contactShowBtnRef.value.style.left = `${setting.contactBtnPosition.x}px`;
    contactShowBtnRef.value.style.top = `${setting.contactBtnPosition.y}px`;
    moveDom(contactShowBtnRef.value, {
      startCallback: () => {
        isStart.value = true;
      },
      endCalllback: (x, y) => {
        setting.contactBtnPosition = { x, y };
        isStart.value = false;
      },
    });
  }
});
const activeMenu = computed({
  get: () => route.path,
  set: (val) => {
    navigateTo(val);
  },
});
</script>

<template>
  <div>
    <span
      ref="contactShowBtnRef"
      class="fixed bottom-30 left-2 z-999 h-3rem w-3rem flex-row-c-c rounded-1/2 shadow-lg el-bg-primary hover:shadow-[var(--el-color-primary)]"
    >
      <i
        class="i-solar:chat-square-bold-duotone p-3 color-white"
        @click="() => {
          setting.isOpenContact = !setting.isOpenContact
        }"
      />
    </span>
    <div
      class="relative z-998 grid grid-cols-6 border-0 border-t-1px px-4 py-4 shadow-md border-default bg-color"
    >
      <div v-for="p in menuList" :key="p.path" :index="p.path" class="flex-row-c-c flex-col cursor-pointer gap-2 rounded-2 px-0 py-3 transition-all" :class="{ active: activeMenu === p.path }" @click="activeMenu = p.path">
        <el-badge :value="p?.tipValue?.value || 0" :hidden="!p?.tipValue?.value" :is-dot="!!p?.isDot" :max="99">
          <i class="p-3" :class="route.path === p.path ? p.activeIcon : p.icon" />
          <span mt-2 block text-center text-3>{{ p.title }}</span>
        </el-badge>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.active {
  --at-apply: "bg-[var(--el-color-primary)]  text-white shadow-inset shadow-lg";
}
</style>
