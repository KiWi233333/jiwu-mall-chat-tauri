<script lang="ts" setup>
const props = defineProps<{
  roomId?: string
}>();
const chat = useChatStore();

const ChatMessageListRef = ref();
const scrollbarRef = ref();

// 发送信息后触发
function onSendMsg(msg: ChatMessageVO) {
  // ChatMessageListRef.value?.appendMsg(msg);
  scrollBottom();
};

const timer = ref<any>(0);
/**
 * 滚动到指定消息
 * @Param msgId 消息id
 * @Param gapCount 偏移消息量（用于翻页）
 */
function scrollReplyMsg(msgId: number, gapCount: number = 0) {
  if (!msgId)
    return;
  const offset = -10;
  const el = document.querySelector(`#chat-msg-${msgId}`) as HTMLElement;
  // 若找不到则进行翻页
  // || !ChatMessageListRef.value?.findMsg(msgId)
  if (!el) {
    timer.value = setTimeout(() => {
      scrollbarRef?.value?.setScrollTop(0);
      scrollReplyMsg(msgId, gapCount);
      if (el) {
        timer.value && clearTimeout(timer.value);
        timer.value = null;
      }
    }, 500);
    return;
  }
  else {
    clearTimeout(timer.value);
    timer.value = null;
  }
  // 找到对应消息
  nextTick(() => {
    if (!el)
      return;
    clearTimeout(timer.value);
    if (scrollbarRef.value?.wrapRef?.scrollTo) {
      scrollbarRef.value?.wrapRef?.scrollTo({
        top: (el?.offsetTop || 0) + offset,
        behavior: "smooth",
      });
    }
    else {
      scrollbarRef.value?.setScrollTop((el?.offsetTop || 0) + offset);
    }

    el.classList.add("reply-shaing");
    timer.value = setTimeout(() => {
      el.classList.remove("reply-shaing");
      timer.value = null;
    }, 3000);
  });
}

const isScroll = ref(false);
// 滚动到底部
function scrollBottom(animate = true) {
  if (isScroll.value)
    return;
  isScroll.value = true;
  timer.value = setTimeout(() => {
    if (animate) {
      scrollbarRef.value?.wrapRef?.scrollTo({
        top: scrollbarRef?.value?.wrapRef?.scrollHeight || 0,
        behavior: "smooth",
      });
    }
    else {
      scrollbarRef.value?.setScrollTop(scrollbarRef?.value?.wrapRef?.scrollHeight || 0);
    }
    isScroll.value = false;
  }, 200);
}

// 保存上一个位置
function saveScrollTop() {
  chat.scrollTopSize = scrollbarRef?.value?.wrapRef?.scrollHeight;
}
function scrollTop(size: number) {
  scrollbarRef.value?.scrollTo({
    top: size || 0,
  });
}

// 绑定事件
nextTick(() => {
  chat.scrollBottom = scrollBottom;
  chat.scrollReplyMsg = scrollReplyMsg;
  chat.saveScrollTop = saveScrollTop;
  chat.scrollTop = scrollTop;
});

onBeforeUnmount(() => {
  timer.value && clearTimeout(timer.value);
  timer.value = null;
});
</script>

<template>
  <div class="content relative flex flex-col bg-light-6 dark:bg-dark-9">
    <!-- 房间信息 -->
    <ChatRoomInfo />
    <!-- 消息列表 -->
    <el-scrollbar
      ref="scrollbarRef"
      class="stop-transition h-full flex-1"
      wrap-class="px-0  shadow-(sm inset) sm:px-2" view-class="msg-list pb-2rem"
    >
      <ChatMessageList
        v-if="chat.theContact.roomId" ref="ChatMessageListRef" class="pt-2rem"
        @scroll-bottom="scrollBottom"
      />
      <div v-else class="h-full w-full flex items-center justify-center">
        开启聊天吧
      </div>
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


