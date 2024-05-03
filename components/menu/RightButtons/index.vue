<script lang="ts" setup>
const { menu } = withDefaults(defineProps<{
  menu?: (ButtonItem | string)[]
}>(), {
  menu: () => ["shopcart", "backtop", {
    name: "service",
    methods: () => {
      navigateTo({
        path: "/chat?type=service",
      });
    },
  },
  "aichat"],
});
export interface ButtonItem {
  /** 菜单名称 */
  name: string
  /** 菜单图标 */
  iconClass?: string
  isTeleport?: boolean
  /** 菜单链接 */
  methods?: (e: Event) => any
}

/**
 * 按钮集合（Map)
 */
const btnsMap = new Map<string, ButtonItem>();

menu.forEach((item) => {
  if (typeof item === "string") {
    btnsMap.set(item, {
      name: item,
      iconClass: "",
      methods: () => {},
    });
  }
  else if (typeof item === "object") {
    btnsMap.set(item.name, item);
  }
});


const user = useUserStore();
const router = useRouter();
function toBack() {
  if (history.length > 1)
    router.back();
  else
    navigateTo("/");
}
const open = ref(false);
</script>

<template>
  <div>
    <ClientOnly>
      <div
        id="right-btns-menu" v-auto-animate class="group btns bottom-2rem flex flex-col"
        :class="open ? 'right-2' : '-right-10 hover:right-2 sm:(right-2)'"
      >
        <div
          key="top"
          class="flex-col animate-[300ms_zoom-in] justify-end btn-group"
          :class="open ? 'flex' : 'hidden  sm:flex'"
        >
          <!-- 回到顶部 -->
          <el-backtop
            key="backtop"
            :class="{
              btn: !btnsMap.get('backtop')?.isTeleport,
            }"
            style=" overflow: visible;width: 3rem; height: 3rem"
            class="btn cursor-pointer rounded-1/2 rounded-1/2 shadow-[#0bdb85] shadow-md shadow-opacity-60 transition-300"
          >
            <i
              class="h-3/5 w-3/5"
              i-solar:alt-arrow-up-bold
              text-light
            />
          </el-backtop>
          <!-- 返回 -->
          <span
            v-if="btnsMap.has('back')"
            key="back"
            class="btn bg-[var(--el-color-primary)] shadow-[var(--el-color-primary)] shadow-md shadow-opacity-40"

            h-3rem w-3rem flex-row-c-c cursor-pointer rounded-4em p-1 transition-300
            @click="toBack"
          >
            <i
              class="i-solar:alt-arrow-left-line-duotone h-2/3 w-2/3"
              mr-0.5 text-light
            />
          </span>
          <!-- 客服 -->
          <nuxt-link
            v-if="user.getTokenFn() && btnsMap.has('service')"
            key="service"
            to="/chat?type=service"
            :class="{
              btn: !btnsMap.get('service')?.isTeleport,
            }"
            class="h-3rem w-3rem flex-row-c-c cursor-pointer border-2px rounded-1/2 bg-[var(--el-color-info)] shadow-[var(--el-color-info)] shadow-lg transition-300 border-default"
          >
            <i
              i-solar:headphones-round-sound-line-duotone bg-light p-.7em
            />
          </nuxt-link>
          <!-- ai聊天 -->
          <MenuAichatBar
            v-if="user.getTokenFn() && btnsMap.has('aichat')"
          />
          <!-- 购物车 -->
          <LazyMenuShopCartBar
            v-if="user.getTokenFn() && btnsMap.has('shopcart')"
            key="shopcart"
            class="h-3rem w-3rem"
          />
          <!-- 添加帖子 -->
          <el-tooltip
            v-if="btnsMap.has('post') && user.getTokenFn()"
            placement="left"
            content="新建帖子"
            :class="{
              btn: btnsMap.get('post')?.isTeleport,
            }"
            popper-class="singleton-tooltip"
          >
            <span
              key="post"
              class="bg-[var(--el-color-info)] shadow-[var(--el-color-info)] shadow-md shadow-opacity-40"

              h-3rem
              w-3rem flex-row-c-c cursor-pointer rounded-4em p-1 transition-300 @click="btnsMap.get('post')?.methods"
            >
              <i
                class="h-1/2 w-1/2"
                i-solar:pen-2-bold-duotone text-light
              />
            </span>
          </el-tooltip>


          <!-- 返回首页 -->
          <NuxtLink
            v-if="btnsMap.has('home')"
            key="home"
            :class="{
              btn: btnsMap.get('home')?.isTeleport,
            }"
            to="/"
            class="h-3rem w-3rem shadow-[var(--el-color-primary)] shadow-md shadow-opacity-40"
            style="background-color: var(--el-color-primary)"
            flex-row-c-c rounded-4em p-1 transition-300
            @click="btnsMap.get('home')?.methods"
          >
            <i
              class="i-solar:home-smile-outline p-2.6 text-light"
              :class="btnsMap.get('home')?.iconClass || ''"
            />
          </NuxtLink>
        </div>
        <!-- 折叠 -->
        <ElIconMenu
          key="btn"
          class="fold z-1 h-3rem w-3rem cursor-pointer rounded-1/2 bg-[var(--el-color-primary)] p-3 text-light transition-300 group-hover:-rotate-90"
          style="box-shadow: 1px 1px 6px var(--el-color-primary-light-3)"
          @click="open = !open"
        />
      </div>
    </ClientOnly>
  </div>
</template>

<style scoped lang="scss">
.btns {
  position: fixed;
  z-index: 990;
  display: flex;
  transition: $transition-delay;
  justify-content: flex-end;
  align-items: center;
  padding: 1rem;
  grid-gap: 0.5rem;
}

:deep(.el-backtop) {
  position: static;
  font-size: 2em;
  color: #fff;
  background-color: var(--el-color-info);
}

.btn-group {
  position: relative;
  transition: all 0.4s;
  align-items: center;
  grid-gap: 0.5rem;

  .btn {
    transition: 0.2s $animate-cubic-bount;
    --at-apply: "w-3rem  md:mt-0 p-0 z-0 opacity-100 md:op-0 group-hover:(opacity-100 h-0 ovferflow-hidden) h-3rem md:h-0 md:transform-[translateY(100%)_scale3d(0, 0, 0.4)]";
  }

}

.btns:hover .btn-group {
  .btn {
    height: 3rem;
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
