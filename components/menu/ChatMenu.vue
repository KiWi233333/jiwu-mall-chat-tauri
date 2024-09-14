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
    title: "AI客服",
    path: "/ai",
    icon: "i-solar:ghost-outline",
    activeIcon: "i-solar:ghost-bold",
  },
  {
    title: "账号",
    path: "/user/safe",
    icon: "i-solar:devices-outline",
    activeIcon: "i-solar:devices-bold-duotone",
    class: "absolute bottom-16 diabled-bg",
  },
  {
    title: "设置",
    path: "/setting",
    icon: "i-solar:settings-linear hover:animate-spin",
    activeIcon: "i-solar:settings-bold-duotone hover:animate-spin",
    class: "absolute bottom-2 diabled-bg",
    tipValue: computed(() => +setting.appUploader.isUpload),
    isDot: true,
  },
];
</script>

<template>
  <div
    class="menu relative z-998 flex flex-col items-center border-l-0 bg-light px-2 md:block border-default dark:bg-[#121212] md:shadow-none"
  >
    <!-- 顶部 -->
    <div class="grid grid-cols-1 w-full grid-gap-6 pt-4 hover:bg-transparent">
      <NuxtLink to="/user" class="z-100 mx-a h-8 w-8 sm:mr-a border-default card-default">
        <CardElImage
          :src="BaseUrlImg + user?.userInfo?.avatar"
          class="relative z-100 mx-a h-8 w-8 sm:mr-a border-default card-default" alt="头像"
        />
      </NuxtLink>
      <!-- 会话 -->
      <span
        block sm:hidden class="mx-a my-2 transition-300 sm:(ml-a mr-0) hover:scale-120 btn-primary"
        @click="setting.isOpenContact = !setting.isOpenContact"
      >
        <i class="i-solar:chat-square-bold-duotone" cursor-pointer p-3 />
      </span>
    </div>
    <div class="mx-a my-4 w-5/6 border-0 border-b-1px border-default" />
    <!-- 个人信息 -->
    <div h-full flex flex-1 flex-shrink-0 flex-col gap-3 overflow-y-auto>
      <NuxtLink
        v-for="p in menuList"
        :key="p.path" :to="p.path" :index="p.path"
        :class="{
          action: route.path === p.path,
          [`${p.class}`]: p.class,
        }"
        class="h-10 w-10 flex-row-c-c transition-all"
      >
        <el-badge :value="p?.tipValue?.value || 0" :hidden="!p?.tipValue?.value" :is-dot="!!p?.isDot" :max="99">
          <i class="icon p-2.5" :class="route.path === p.path ? p.activeIcon : p.icon" />
        </el-badge>
      </NuxtLink>
    </div>
    <div
      v-if="setting.isChatFold"
      class="absolute left-0 top-0 block h-100dvh w-100vw overflow-hidden bg-[#8181811a] -z-1 md:hidden" style="background-color: #2222223a;
    " @click="setting.isChatFold = false"
    />
  </div>
</template>

<style lang="scss" scoped>
.menu {
  height: calc(100dvh - $top-nav-height);
}
.icon-tip {
  position: absolute;
  right: 0;
  top:0;
}
.action {
  --at-apply: "card-default !bg-[var(--el-color-primary)] shadow ";
  .icon {
    --at-apply: "bg-light dark:bg-none";
  }
}
</style>
