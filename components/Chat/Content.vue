<script lang="ts" setup>
defineProps<{
  roomId?: string
}>();
const chat = useChatStore();
const ChatMessageListRef = ref();
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
  // 若找不到则进行翻页
  // || !ChatMessageListRef.value?.findMsg(msgId)
  if (!el) {
    timer.value = setTimeout(() => {
      const el = document.querySelector(`#chat-msg-${msgId}`) as HTMLElement;
      if (el) {
        timer.value && clearTimeout(timer.value);
        timer.value = null;
        scrollReplyMsg(msgId, gapCount); // 递归翻页
      }
      else {
        scrollbarRef.value?.wrapRef?.scrollTo({ // 缓动
          top: 0,
          behavior: "smooth",
        });
        scrollReplyMsg(msgId, gapCount);
        // // 是否缓动
        // isAnimated
        //   ?
        //   : scrollbarRef?.value?.setScrollTop(0);// 静态
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
      // 是否缓动
      isAnimated
        ? scrollbarRef.value?.wrapRef?.scrollTo({ // 缓动
          top: (el?.offsetTop || 0) + offset,
          behavior: "smooth",
        })
        : scrollbarRef?.value?.setScrollTop((el?.offsetTop || 0) + offset);// 静态
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
  if (animate) {
    scrollbarRef.value?.wrapRef?.scrollTo({
      top: scrollbarRef?.value?.wrapRef?.scrollHeight || 0,
      behavior: "smooth",
    });
  }
  else {
    scrollbarRef.value?.setScrollTop(scrollbarRef?.value?.wrapRef?.scrollHeight || 0);
  }
}

// 保存上一个位置
function saveScrollTop() {
  chat.scrollTopSize = scrollbarRef?.value?.wrapRef?.scrollHeight;
}
async function scrollTop(size: number) {
  await scrollbarRef.value?.scrollTo({
    top: size || 0,
  });
}
// 绑定事件
chat.scrollBottom = scrollBottom;
chat.scrollReplyMsg = scrollReplyMsg;
chat.saveScrollTop = saveScrollTop;
chat.scrollTop = scrollTop;

// 发送信息后触发
function onSendMsg(msg: ChatMessageVO) {
  // ChatMessageListRef.value?.appendMsg(msg);
  nextTick(() => {
    setTimeout(() => {
      scrollBottom(false);
    }, 300);
  }); // 发送消息后自动滚动到底部
};

onBeforeUnmount(() => {
  timer.value && clearTimeout(timer.value);
  timer.value = null;
});

// 滚动事件
const onScroll = useDebounceFn((e) => {
  // 滚动到底部
  const offset = 100;
  if (e.scrollTop >= scrollbarRef?.value?.wrapRef?.scrollHeight - 462 - offset) {
    if (chat.theContact.roomId && chat.theContact.unreadCount > 0) {
      chat.setReadList(chat.theContact.roomId);
    }
  }
}, 500);
</script>

<template>
  <div class="content relative flex flex-col bg-light-6 dark:bg-dark-9">
    <!-- 房间信息 -->
    <ChatRoomInfo />
    <!-- 消息列表 -->
    <el-scrollbar
      ref="scrollbarRef"
      class="stop-transition h-full flex-1"
      wrap-class="px-0  shadow-(sm inset) sm:px-2"
      view-class="msg-list pb-2rem" @scroll="onScroll"
    >
      <ChatMessageList
        ref="ChatMessageListRef"
        class="pt-2rem"
      />
    </el-scrollbar>
    <!-- 发送 -->
    <ChatMsgForm class="flex-shrink-0" @submit="onSendMsg" />
  </div>
</template>

<style lang="scss" scoped>
.content {

  :deep(.el-scrollbar) {
    .el-scrollbar__bar {
      opacity: 0.6;
      .el-scrollbar__thumb:active,
      .el-scrollbar__thumb:hover {
        opacity: 1;
      }
    }
  }
}
</style>


