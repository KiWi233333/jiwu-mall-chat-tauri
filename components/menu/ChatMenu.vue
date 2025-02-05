<script lang="ts" setup>
import { NuxtLink } from "#components";
import { useOpenExtendWind } from "./extension";

defineEmits<{
  (e: "close"): void
}>();
// 路由
const route = useRoute();
const user = useUserStore();
const ws = useWsStore();
const setting = useSettingStore();
const chat = useChatStore();

const applyUnRead = ref(0);
/**
 * 获取好友申请数量 (未读)
 */
async function getApplyCount() {
  if (!user.getTokenFn())
    return;
  const res = await getApplyUnRead(user.getToken);
  if (res.code === StatusCode.SUCCESS) {
    applyUnRead.value = res.data.unReadCount;
  }
}
watch(() => route.path, (newVal, oldVal) => {
  if (newVal === "/friend" || oldVal === "/friend") {
    getApplyCount();
  }
});
watch(() => ws.wsMsgList.applyMsg.length, (newVal, oldVal) => {
  getApplyCount();
});
onMounted(() => {
  getApplyCount();
});
onActivated(() => {
  getApplyCount();
});
onDeactivated(() => {
  getApplyCount();
});

const { open: openExtendMenu } = useOpenExtendWind();
// @unocss-include
const menuList = computed<MenuItem[]>(() => ([
  {
    title: "聊天",
    path: "/",
    icon: "i-solar:chat-line-broken",
    activeIcon: "i-solar:chat-line-bold-duotone",
    tipValue: chat.getContactList.reduce((acc, cur) => acc + cur.unreadCount, 0),
  },
  {
    title: "好友",
    path: "/friend",
    icon: "i-solar:users-group-rounded-line-duotone",
    activeIcon: "i-solar:users-group-rounded-bold-duotone",
    tipValue: applyUnRead.value,
  },
  {
    title: "AI客服",
    path: "/ai",
    icon: "i-solar:ghost-outline",
    activeIcon: "i-solar:ghost-bold-duotone",
  },
  ...(setting.selectExtendMenuList || []).map(p => ({
    title: p.title,
    icon: p.icon,
    activeIcon: p.activeIcon,
    loading: p.loading,
    onClick: () => openExtendMenu(p),
  }) as MenuItem),
  {
    title: "扩展",
    icon: " i-solar:widget-line-duotone hover:(i-solar:widget-bold-duotone ) ",
    activeIcon: "i-solar:widget-bold-duotone",
    onClick: () => chat.showExtension = true,
  },
  {
    title: "账号",
    path: "/user/safe",
    icon: "i-solar:devices-outline",
    activeIcon: "i-solar:devices-bold-duotone",
    class: "absolute bottom-15 diabled-bg",
  },
  {
    title: "设置",
    path: "/setting",
    icon: "i-solar:settings-linear hover:animate-spin block",
    activeIcon: "i-solar:settings-bold-duotone hover:animate-spin block",
    class: "absolute bottom-3 diabled-bg",
    tipValue: +setting.appUploader.isUpload,
    isDot: true,
  },
]));

export interface MenuItem {
  title: string
  path?: string
  icon: string
  activeIcon: string
  tipValue?: any
  isDot?: boolean
  class?: string
  children?: MenuItem[]
  onClick?: (e: MouseEvent) => void
}
</script>

<template>
  <div
    class="relative z-998 h-full border-default-r card-bg-color"
  >
    <!-- 顶部 -->
    <div class="grid grid-cols-1 w-full w-full grid-gap-6 px-2 pt-4 hover:bg-transparent">
      <NuxtLink to="/user" class="z-100 mx-a h-8 w-8 sm:mr-a card-default">
        <CardElImage
          :src="BaseUrlImg + user?.userInfo?.avatar"
          class="relative z-100 mx-a h-8 w-8 sm:mr-a border-default card-default" alt="头像"
        />
      </NuxtLink>
    </div>
    <div class="mx-a my-4 w-5/6 border-0 border-b-1px px-2 border-default" />
    <!-- 菜单 -->
    <div name="pop-list" tag="div" class="flex flex-col gap-3 overflow-y-auto px-2">
      <component
        :is="p.path ? NuxtLink : 'div'"
        v-for="p in menuList"
        :key="p.path"
        v-loading="(p as any).loading" :to="p.path"
        :index="p.path"
        :element-loading-spinner="defaultLoadingIcon"
        element-loading-custom-class="text-.4em"
        :class="{
          action: route.path === p.path,
          [`${p.class}`]: p.class,
        }"
        :title="p.title"
        class="group item"
        @click="(e: MouseEvent) => {
          if (p.onClick) {
            e.stopPropagation();
            p.onClick(e);
          }
        }"
      >
        <el-badge :value="p.tipValue" :hidden="!p?.tipValue" :is-dot="!!p?.isDot" :offset="[-2, -2]" :max="99">
          <i class="icon p-2.5" :class="route.path === p.path ? p.activeIcon : p.icon" />
        </el-badge>
      </component>
    </div>
    <div
      v-if="setting.isChatFold"
      class="absolute left-0 top-0 block h-100dvh w-100vw overflow-hidden bg-[#8181811a] -z-1 md:hidden"
      style="background-color: #2222223a;"
      @click="setting.isChatFold = false"
    />
  </div>
</template>

<style lang="scss" scoped>
.icon-tip {
  position: absolute;
  right: 0;
  top:0;
}
.item {
  --at-apply: "card-rounded-df hover:(bg-color-3 text-color-[--el-color-primary]) h-10 w-10 flex-row-c-c cursor-pointer transition-200";
  &.action {
    --at-apply: "shadow !bg-[--el-color-primary]";
    .icon {
      --at-apply: "bg-light dark:bg-light";
    }
  }
  :deep(.el-badge) {
    .el-badge__content {
      font-size: 0.6em !important;
    }
  }
}
</style>
