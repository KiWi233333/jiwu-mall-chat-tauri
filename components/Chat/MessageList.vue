<script lang="ts" setup>
import type { WSMsgDelete, WSMsgRecall } from "~/composables/types/WsType";

const chat = useChatStore();
const isLoading = ref<boolean>(false);
const user = useUserStore();
const ws = useWs();
const pageInfo = ref({
  cursor: null as null | string,
  isLast: false,
  size: 20,
});
/**
 * 加载数据
 */
async function loadData(call?: () => void) {
  if (isLoading.value || pageInfo.value.isLast || !chat.theContact.roomId)
    return;
  isLoading.value = true;
  getChatMessagePage(chat.theContact.roomId, pageInfo.value.size, pageInfo.value.cursor, user.getToken).then(({ data }) => {
    // 追加数据
    if (data.list && data.list.length)
      chat.theContact.msgList.unshift(...data.list);
    const oldSize = chat.scrollTopSize;

    nextTick(() => {
      // 更新滚动位置
      chat.saveScrollTop && chat.saveScrollTop();
      if (pageInfo.value.cursor === null) {
        call && call();
      }
      else {
        // 更新滚动位置
        const newSize = chat.scrollTopSize;
        // 距离顶部
        const msgRangeSize = newSize - oldSize;
        if (msgRangeSize > 0)
          chat.scrollTop(msgRangeSize);
      }
      pageInfo.value.isLast = data.isLast;
      pageInfo.value.cursor = data.cursor;
      isLoading.value = false;
    });
  }).catch(() => {
    isLoading.value = false;
    pageInfo.value.isLast = false;
    pageInfo.value.cursor = null;
  });
}


// 监听房间错误
watch(() => chat.theContact.roomId, (val) => {
  reload();
  // 消息阅读上报
  if (val)
    chat.setReadList(val);
}, {
  immediate: true,
});


// 重新加载
function reload() {
  chat.theContact.msgList = [];
  pageInfo.value = {
    cursor: null as null | string,
    isLast: false,
    size: 20,
  };
  chat.scrollTopSize = 0;
  loadData(() => {
    chat.scrollBottom();
  });
}
/**
 * 新消息
 */
watch(() => ws.wsMsgList.newMsg.length, () => {
  // 1、新消息
  resolveNewMsg(ws.wsMsgList.newMsg);
}, {
  immediate: true,
  deep: true,
});
watch(() => ws.wsMsgList.recallMsg.length, () => {
  // 2、撤回消息
  resolveRevokeMsg(ws.wsMsgList.recallMsg);
}, {
  immediate: true,
  deep: true,
});

watch(() => ws.wsMsgList.deleteMsg.length, () => {
  // 3、删除消息
  resolveDeleteMsg(ws.wsMsgList.deleteMsg);
}, {
  immediate: true,
  deep: true,
});

/**
 * 新消息处理
 * @param list 原始列表
 */
function resolveNewMsg(list: ChatMessageVO[]) {
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    // 1）更新会话列表
    upContact(p.message.roomId,
      {
        text: `${p.fromUser.nickName}：${p.message.content}`,
      }, false, (contact) => {
        if (contact.roomId !== chat.theContact.roomId) {
        // 添加未读数量
          contact.unreadCount += 1;
        }
        contact.activeTime = Date.now();
      });

    // 2）更新消息列表
    if (p.message.roomId !== chat.theContact.roomId)
      continue;

    // 消费消息
    ws.wsMsgList.newMsg.splice(i, 1);
    chat.setReadList(chat.theContact.roomId);
    // 本房间追加消息
    const msg = findMsg(p.message.id);
    if (!msg)
      chat.theContact.msgList.push(p);
  }
}

/**
 * 撤回消息处理
 * @param list 列表
 */
function resolveRevokeMsg(list: WSMsgRecall[]) {
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    // 更新会话列表
    for (let k = 0; k < chat.contactList.length; k++) {
      const r = chat.contactList[k];
      if (r.roomId === p.roomId) {
        r.text = "撤回了一条消息";
        break;
      }
    }
    if (p.roomId !== chat.theContact.roomId) {
      continue;
    }
    else {
      // 消费消息
      ws.wsMsgList.recallMsg.splice(i, 1);
    }
    // 本房间修改状态
    const msg = findMsg(p.msgId);
    if (msg) {
      msg.message.type = MessageType.RECALL;
      msg.message.content = `${chat.theContact.type === RoomType.GROUP ? `"${msg.fromUser.nickName}"` : "\"对方\""}撤回了一条消息`;
      msg.message.body = undefined;
      ws.wsMsgList.recallMsg = ws.wsMsgList.recallMsg.filter(k => k.msgId !== p.msgId);
    }
  }
}

/**
 * 删除消息处理
 * @param list 列表
 */
function resolveDeleteMsg(list: WSMsgDelete[]) {
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    // 更新会话列表
    for (let k = 0; k < chat.contactList.length; k++) {
      const r = chat.contactList[k];
      if (r.roomId === p.roomId) {
        r.text = "删除了一条消息";
        break;
      }
    }
    if (p.roomId !== chat.theContact.roomId) {
      continue;
    }
    else {
      // 消费消息
      ws.wsMsgList.deleteMsg.splice(i, 1);
    }
    // 本房间修改状态
    const msg = findMsg(p.msgId);
    if (msg) {
      msg.message.type = MessageType.DELETE;
      msg.message.content = `${chat.theContact.type === RoomType.GROUP ? `"${msg.fromUser.nickName}"` : "\"对方\""}删除了一条消息`;
      msg.message.body = undefined;
      ws.wsMsgList.deleteMsg = ws.wsMsgList.deleteMsg.filter(k => k.msgId !== p.msgId);
    }
  }
}

// 更新会话
function upContact(roomId: number, data: Partial<ChatContactVO>, isReload = false, callBack?: (contact: ChatContactVO) => void) {
  for (let i = 0; i < chat.contactList.length; i++) {
    const p = chat.contactList[i];
    if (p.roomId === roomId) {
      p.text = data.text || p.text;
      p.unreadCount = data.unreadCount || p.unreadCount;
      p.activeTime = data.activeTime || p.activeTime;
      p.avatar = data.avatar || p.avatar;
      callBack && callBack(p);
    }
  }
}

// 添加消息到列表
function appendMsg(data: ChatMessageVO) {
  if (data)
    chat.theContact.msgList.push(data);
}
function findMsg(msgId: number) {
  for (const p of chat.theContact.msgList) {
    if (p.message.id === msgId)
      return p;
  }
}
// 暴露
defineExpose({
  reload,
  appendMsg,
  findMsg,
});
</script>

<template>
  <div
    relative v-bind="$attrs"
    flex
    flex-col
    class="msg-list"
  >
    <ListDisAutoIncre
      :auto-stop="false"
      :no-more="pageInfo.isLast"
      :loading="isLoading"
      loading-class="load-chaotic-orbit"
      @load="loadData"
    >
      <!-- 消息适配器 -->
      <ChatMsgMain
        v-for="(msg, i) in chat.theContact.msgList"
        :id="`chat-msg-${msg.message.id}`"
        :key="msg.message.id"
        :index="i"
        class="animate-[0.2s_zoom-in]"
        :data="msg"
      />
    </ListDisAutoIncre>
  </div>
</template>

<style lang="scss" scoped>
.msg-list {
  div,
  small,
  span,
  p {
    word-break: break-all;
    white-space: pre-wrap;
    line-height: 1.4em;
  }
}
</style>
