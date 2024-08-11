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
    class="menu relative z-998 bg-light transition-300 transition-width md:block dark:bg-[#121212] md:shadow-none"
  >
    <el-menu class="sm:w-12rem" :router="true" :default-active="route.path" :collapse="setting.isUserFold">
      <!-- 顶部 -->
      <div class="grid grid-cols-1 w-full grid-gap-6 pt-4 transition-300 transition-300 hover:bg-transparent">
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
      <div flex flex-1 flex-col overflow-y-auto>
        <el-menu-item v-for="p in menuList" :key="p.path" :index="p.path" :class="p.class">
          <el-badge :value="p?.tipValue?.value || 0" :hidden="!p?.tipValue?.value" :is-dot="!!p?.isDot" :max="99">
            <i class="icon" :class="route.path === p.path ? p.activeIcon : p.icon" />
          </el-badge>
        </el-menu-item>
      </div>
    </el-menu>
    <div
      v-if="setting.isChatFold"
      class="absolute left-0 top-0 block h-100vh w-100vw overflow-hidden bg-[#8181811a] -z-1 md:hidden" style="background-color: #2222223a;
    " @click="setting.isChatFold = false"
    />
  </div>
</template>

<style lang="scss" scoped>
.menu {
  user-select: none;
  position: sticky;
  top: 0;
  left: 0;
  height: calc(100vh - $top-nav-height);
  :deep(.el-menu--popup-container),
  :deep(.el-menu) {
    height: 100%;
    .el-menu-item {
      position: relative;
      padding: 0.7em;
      padding-top: 0;
      padding-bottom: 0;
      overflow: hidden;
      text-overflow: clip;
      height: 3em;
      border-radius: 8px;
      margin: 6px 10px;
      transition: $transition-delay;
      border: 1px dashed transparent;

      span {
        overflow: hidden;
        text-overflow: ellipsis;
        transition: 100ms;
      }
      &:hover,
      &.is-active:hover,
      &.is-active {
        border: 1px solid;
        color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);

        i {
          color: var(--el-color-primary);
        }
      }

      &:hover {
        border: 1px dashed;
      }
    }
    .absolute.el-menu-item {
      position: absolute;
    }
    .diabled-bg.el-menu-item {
      background-color: transparent !important;
      border-color: transparent !important;
    }
    .diabled-bg.el-menu-item.is-active.is-active {
      .icon {
        color: var(--el-color-primary) !important;
      }
    }
    .el-menu-item-group {
      .el-menu-item {
        background-color: #8181811a;
        opacity: 0.9;

        &:hover {
          background-color: #8181811a;
          opacity: 1;
        }

        .second-icon {
          padding: 2px;
        }
      }

      .el-menu-item:hover {
        background-color: transparent;
        color: var(--el-color-primary);
      }

      .el-menu-item-group__title ml-2 {
        display: none;
      }
    }

    // 图标
    .icon {
      display: block;
      width: 1.5em;
      height: 1.5em;

      &:hover {
        transition: $transition-delay;
        color: var(--el-color-primary);
      }
    }


  }
}
:deep(.el-menu){
  .el-menu-item.is-active.is-active{
    &,
    &:hover{
      .icon ,
      .title {
        color: #fff;
      }
      border-color: var(--el-color-primary-light-7);
      background-color: var(--el-color-primary);
    }
    border-color: var(--el-color-primary-light-7);
  }
}
.icon-tip {
  position: absolute;
  right: 0;
  top:0;
}
</style>
