<script lang="ts" setup>
import { getApplyUnRead } from "~/composables/api/chat/friend";

defineEmits<{
  (e: "close"): void
}>();
// 路由
const route = useRoute();
const user = useUserStore();
const ws = useWs();


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
    icon: "i-solar:ghost-line-duotone",
    activeIcon: "i-solar:ghost-bold-duotone",
  },
  {
    title: "个人",
    path: "/user",
    icon: "i-solar:user-linear",
    activeIcon: "i-solar:user-bold-duotone",
  },
  {
    title: "设置",
    path: "/setting",
    icon: "i-solar:settings-linear",
    activeIcon: "i-solar:settings-bold-duotone",
  },
];
const setting = useSettingStore();
</script>

<template>
  <div
    class="menu relative z-998 h-auto max-w-1/2 bg-light bg-opacity-80 transition-300 transition-width md:block dark:bg-[#121212] md:shadow-none"
    :class="{
      'max-w-0': setting.showChatMenu,
    }"
  >
    <el-menu
      class="sm:w-12rem"
      :class="{
        hidden: setting.showChatMenu,
      }"
      :router="true"
      :default-active="route.path"
      :collapse="setting.isUserFold"
    >
      <!-- 顶部 -->
      <div class="grid grid-cols-1 w-full grid-gap-6 py-4 pt-6 transition-300 transition-300 hover:bg-transparent">
        <CardElImage :src="BaseUrlImg + user.userInfo.avatar" class="relative z-100 mx-a h-6 w-6 sm:mr-a border-default card-default" alt="头像" />
        <!-- 会话 -->
        <span
          block sm:hidden
          class="mx-a transition-300 btn-primary sm:(ml-a mr-0) hover:scale-120"
          @click="setting.isOpenContact = !setting.isOpenContact"
        >
          <i class="i-solar:chat-square-bold-duotone" cursor-pointer p-3 />
        </span>
      </div>
      <div class="mx-a my-4 w-5/6 border-0 border-b-1px border-default" />
      <!-- 个人信息 -->
      <el-menu-item
        v-for="p in menuList"
        :key="p.path"
        :index="p.path"
      >
        <el-badge :value="p?.tipValue?.value || 0" :hidden="!p?.tipValue?.value" :max="99">
          <i
            class="icon"
            :class="route.path === p.path ? p.activeIcon : p.icon"
          />
        </el-badge>
        <span class="title overflow-hidden px-6 font-500 tracking-0.2em">{{ p.title }}</span>
      </el-menu-item>
    </el-menu>
    <div
      v-if="setting.isChatFold"
      class="absolute left-0 top-0 block h-100vh w-100vw overflow-hidden bg-[#8181811a] -z-1 md:hidden"
      style="background-color: #2222223a;
    "
      @click="setting.isChatFold = false"
    />
    <!-- 折叠 -->
    <!-- <span
      class="absolute bottom-4 z-999 flex-row-c-c rounded-r-2 op-80 shadow-md transition-all -right-6 sm:h-2.6rem border-default hover:(op-100)"
      :class="setting.showChatMenu ? ' pl-1px h-3rem w-1.6rem el-bg-primary text-white' : 'pl-1px  h-3rem w-1.6rem el-bg-primary text-white'"
      @click="setting.showChatMenu = !setting.showChatMenu"
    >
      <i
        :class="setting.showChatMenu ? 'rotate-0 ' : 'rotate-180'"
        class="i-solar:alt-arrow-right-line-duotone block p-0.6em transition-all"
      />
    </span> -->
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
      margin: 10px;
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
