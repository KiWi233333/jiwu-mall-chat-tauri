<script lang="ts" setup>
const chat = useChatStore();
const isLoading = ref<boolean>(false);
const user = useUserStore();
const pageInfo = ref({
  cursor: null as null | string,
  isLast: true,
  size: 20,
});
const theRequest = ref<Promise<any> | null>(null);
const isReload = ref(false);
/**
 * 加载数据
 */
async function loadData(call?: (data?: ChatMessageVO[]) => void) {
  const roomId = chat.theContact.roomId;
  if (isLoading.value || isReload.value || pageInfo.value.isLast || !roomId)
    return;
  if (chat.isMsgListScroll) {
    return;
  }
  isLoading.value = true;

  getChatMessagePage(roomId, pageInfo.value.size, pageInfo.value.cursor, user.getToken).then(({ data }) => {
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
    pageInfo.value.cursor = data.cursor;
  }).catch(() => {
    isLoading.value = false;
    pageInfo.value.isLast = false;
    pageInfo.value.cursor = null;
  });
}
// 重新加载
function reload(roomId: number) {
  // 重置滚动位置
  chat.scrollTopSize = 0;
  pageInfo.value = {
    cursor: null as null | string,
    isLast: false,
    size: 20,
  };
  chat.theContact.msgList.splice(0);
  isReload.value = true;
  isLoading.value = true;
  theRequest.value = getChatMessagePage(roomId, 20, null, user.getToken).then(async ({ data }) => {
    if (roomId !== chat.theContact.roomId)
      return;
    // 追加数据
    if (!data?.list?.length)
      return;
    chat.theContact.msgList = data.list;
    pageInfo.value.isLast = data.isLast;
    pageInfo.value.cursor = data.cursor;
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
watch(() => chat.theContact.roomId, (val, oldVal) => {
  if (val) {
    reload(val);
    // 消息阅读上报
    chat.setReadList(val);
  }
  if (oldVal) { // 旧会话消息上报
    chat.setReadList(oldVal);
  }
}, {
  immediate: true,
});


// 滚动
const scrollbarRef = ref();
const timer = ref<any>(0);
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
    clearTimeout(timer.value);
    timer.value = null;
    // 找到对应消息
    nextTick(() => {
      if (!el)
        return;
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
  scrollTop(scrollbarRef?.value?.wrapRef?.scrollHeight, animate);
}

// 保存上一个位置
function saveScrollTop() {
  chat.scrollTopSize = scrollbarRef?.value?.wrapRef?.scrollHeight;
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

// 滚动事件
const onScroll = useDebounceFn((e) => {
  // 滚动到底部
  const offset = 100;
  if (e.scrollTop >= scrollbarRef?.value?.wrapRef?.scrollHeight - 462 - offset) {
    if (chat.theContact.roomId && (chat.theContact.unreadCount > 0 || chat.contactMap?.[chat.theContact.roomId]?.unreadCount)) {
      chat.setReadList(chat.theContact.roomId);
    }
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
    class="flex-1"
    height="100%"
    wrap-class="px-0 shadow-inner-bg sm:px-2"
    view-class="msg-list pb-2rem" @scroll="onScroll"
  >
    <div
      v-bind="$attrs"
      class="msg-list flex flex-col op-0 transition-(300 opacity)"
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
.msg-list {
  div,
  small,
  span,
  p {
    word-break: break-all;
    white-space: pre-wrap;
    line-height: 1.5;
  }
}
.isReload {
  .animate {
    animation: none !important;
  }
}
</style>
