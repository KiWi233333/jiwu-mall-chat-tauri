<script lang="ts" setup>
const chat = useChatStore();
const user = useUserStore();
const setting = useSettingStore();

// 消息
const pageInfo = computed({
  get: () => chat.theContact.pageInfo,
  set: (val: PageInfo) => {
    chat.theContact.pageInfo = val;
  },
});
const isLoading = computed({
  get: () => chat.theContact.isLoading,
  set: (val: boolean) => {
    chat.theContact.isLoading = val;
  },
});
const isReload = computed({
  get: () => chat.theContact.isReload,
  set: (val: boolean) => {
    chat.theContact.isReload = val;
  },
});

// 滚动
const scrollbarRef = useTemplateRef("scrollbarRef");
const timer = ref<any>(0);

/**
 * 加载数据
 */
async function loadData(roomId?: number, call?: (data?: ChatMessageVO[]) => void) {
  roomId = roomId || chat.theContact.roomId;
  if (isLoading.value || isReload.value || pageInfo.value.isLast || !roomId)
    return;
  if (chat.isMsgListScroll) {
    return;
  }
  isLoading.value = true;
  const res = await getChatMessagePage(roomId, pageInfo.value.size, pageInfo.value.cursor, user.getToken).catch(() => {
    isLoading.value = false;
    pageInfo.value.isLast = false;
    pageInfo.value.cursor = undefined;
  });
  if (res?.code !== StatusCode.SUCCESS) {
    console.warn("加载消息失败");
    return;
  }
  const data = res.data;
  if (roomId !== chat.theContact.roomId)
    return;
    // 追加数据
  if (data?.list && data.list.length)
    chat.theContact.msgList.unshift(...data.list);
  const oldSize = chat.scrollTopSize;
  nextTick(() => {
    // 更新滚动位置
    chat.saveScrollTop && chat.saveScrollTop();
    if (pageInfo.value.cursor === null && !chat.theContact.msgList.length) { // 第一次加载默认没有动画
      chat.scrollBottom(false);
      call && call(chat.theContact.msgList || []);
    }
    else {
      // 更新滚动位置
      const newSize = chat.scrollTopSize;
      // 距离顶部
      const msgRangeSize = newSize - oldSize;
      if (msgRangeSize > 0)
        chat.scrollTop(msgRangeSize);
    }
    isLoading.value = false;
  });
  pageInfo.value.isLast = data.isLast;
  pageInfo.value.cursor = data.cursor || undefined;
}
// 重新加载
function reload(roomId?: number) {
  roomId = roomId || chat.theContact.roomId;
  //  TODO:判断缓存是否超过 10 分钟
  // 重置滚动位置
  chat.scrollTopSize = 0;
  pageInfo.value = {
    cursor: undefined as undefined | string,
    isLast: false,
    size: 20,
  };
  chat.theContact.msgList.splice(0);
  isReload.value = true;
  isLoading.value = true;
  getChatMessagePage(roomId, 20, null, user.getToken).then(async ({ data }) => {
    if (roomId !== chat.theContact.roomId)
      return;
    // 追加数据
    if (!data?.list?.length)
      return;
    chat.theContact.msgList = data.list;
    pageInfo.value.isLast = data.isLast;
    pageInfo.value.cursor = data.cursor || undefined;
    await nextTick();
    isLoading.value = false;
    isReload.value = false;
    chat.scrollBottom(false);
    chat.saveScrollTop && chat.saveScrollTop();
  }).catch(async () => {
    await nextTick();
    isLoading.value = false;
    isReload.value = false;
    chat.scrollBottom(false);
  })
  ;
}

// 监听房间
watch(() => chat.theContactId, async (val, oldVal) => {
  if (val) {
    // 消息阅读上报
    chat.setReadList(val);
    await nextTick();
    scrollbarRef.value && scrollBottom(false);
    if (!chat.contactDetailMapCache[val]?.msgList.length || chat.contactMap[val]?.lastMsgId !== chat.contactDetailMapCache[val].lastMsgId) { // 会话判断是否同步
      await reload(val);
    }
  }
  if (oldVal) { // 旧会话消息上报
    chat.setReadList(oldVal);
  }
}, {
  immediate: true,
});

/**
 * 滚动到指定消息
 * @Param msgId 消息id
 * @Param gapCount 偏移消息量（用于翻页）
 * @Param isAnimated 是否动画滚动
 */
function scrollReplyMsg(msgId: number, gapCount: number = 0, isAnimated: boolean = true) {
  if (!msgId)
    return;
  const offset = -10;
  const el = document.querySelector(`#chat-msg-${msgId}`) as HTMLElement;
  if (!el) {
    timer.value = setTimeout(() => {
      const el = document.querySelector(`#chat-msg-${msgId}`) as HTMLElement;
      if (el) {
        timer.value && clearTimeout(timer.value);
        timer.value = null;
        scrollReplyMsg(msgId, gapCount); // 递归翻页
      }
      else {
        scrollTop(0);
        scrollReplyMsg(msgId, gapCount);
      }
    }, 120);
  }
  else {
    timer.value = null;
    // 找到对应消息
    nextTick(() => {
      if (!el)
        return;
      if (el.classList.contains("reply-shaing")) {
        return;
      }
      clearTimeout(timer.value);
      scrollTop((el?.offsetTop || 0) + offset, isAnimated);
      el.classList.add("reply-shaing");
      timer.value = setTimeout(() => {
        el.classList.remove("reply-shaing");
        timer.value = null;
      }, 2000);
    });
  }
}

// 滚动到底部
function scrollBottom(animate = true) {
  if (!scrollbarRef?.value?.wrapRef?.scrollHeight) {
    return;
  }
  scrollTop(scrollbarRef?.value?.wrapRef?.scrollHeight, animate);
}

// 保存上一个位置
function saveScrollTop() {
  chat.scrollTopSize = scrollbarRef?.value?.wrapRef?.scrollHeight || 0;
}

// 滚动到指定位置
async function scrollTop(size: number, animated = false) {
  if (chat.isMsgListScroll) {
    return;
  }
  chat.isMsgListScroll = true;
  scrollbarRef.value?.wrapRef?.scrollTo({ // 缓动
    top: size || 0,
    behavior: animated ? "smooth" : undefined,
  });
  if (animated) {
    await nextTick();
    setTimeout(() => {
      chat.isMsgListScroll = false;
    }, 300);
  }
  else {
    chat.isMsgListScroll = false;
  }
}
const offset = computed(() => setting.isMobileSize ? -730 : -678);
// 滚动事件
const onScroll = useDebounceFn((e) => {
  // 滚动到底部
  if (e.scrollTop >= (scrollbarRef?.value?.wrapRef?.scrollHeight || 0) + offset.value) {
    // console.log(scrollbarRef?.value?.wrapRef?.scrollHeight - e.scrollTop);
    chat.setReadList(chat.theContact.roomId);
  }
}, 300);

// 绑定事件 MSG_LIST_SCROLL
onMounted(() => {
  mitter.on(MittEventType.MSG_LIST_SCROLL, ({ type, payload }) => {
    switch (type) {
      case "scrollBottom":
        scrollBottom(payload?.animate);
        break;
      case "scrollReplyMsg":
        scrollReplyMsg(payload?.msgId, payload.gapCount, payload?.animate);
        break;
      case "saveScrollTop":
        saveScrollTop();
        break;
      case "scrollTop":
        scrollTop(payload?.size, payload?.animate);
        break;
    }
  });
});
onBeforeUnmount(() => {
  timer.value && clearTimeout(timer.value);
  timer.value = null;
  // 解绑事件
  mitter.off(MittEventType.MSG_LIST_SCROLL);
});

// 暴露
defineExpose({
  reload,
});
</script>

<template>
  <el-scrollbar
    ref="scrollbarRef"
    class="max-w-full flex-1"
    height="100%"
    wrap-class="px-0 shadow-inner-bg"
    view-class="pb-10 pt-4"
    @scroll="onScroll"
  >
    <div
      v-bind="$attrs"
      class="msg-list px-1 op-0 transition-(200 property-opacity) sm:px-2"
      :class="{ 'op-100': !isReload }"
    >
      <ListDisAutoIncre
        :auto-stop="false"
        :delay="800"
        :threshold-height="200"
        :immediate="false"
        :no-more="pageInfo.isLast && !isReload"
        :loading="isLoading && !isReload"
        loading-class="load-chaotic-orbit"
        @load="loadData"
      >
        <!-- 消息适配器 -->
        <ChatMsgMain
          v-for="(msg, i) in chat.theContact.msgList"
          :id="`chat-msg-${msg.message.id}`"
          :key="msg.message.id"
          :index="i"
          :data="msg"
          :prev-msg="i > 0 ? chat.theContact.msgList[i - 1] : {}"
        />
      </ListDisAutoIncre>
    </div>
    <!-- 骨架屏 -->
    <!-- <div v-if="isReload" class="msg-list flex flex-col transition-(200 opacity)">
      <ChatMsgSkeleton v-for="i in 10" :key="i" />
    </div> -->
  </el-scrollbar>
</template>

<style lang="scss" scoped>
.shadow-inner-bg {
  box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 8px 0px inset, rgba(0, 0, 0, 0.1) 0px -2px 8px 0px inset;
}
// .msg-list { // 禁止复用
// }
.isReload {
  .animate {
    animation: none !important;
  }
}
</style>
