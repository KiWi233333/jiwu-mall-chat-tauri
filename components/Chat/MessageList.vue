<script lang="ts" setup>
import type { WSMsgDelete, WSMsgRecall } from "~/composables/types/WsType";

const UpdateContactList: { [key: number]: boolean } = {};
const chat = useChatStore();
const isLoading = ref<boolean>(false);
const user = useUserStore();
const ws = useWs();
const pageInfo = ref({
  cursor: null as null | string,
  isLast: true,
  size: 20,
});
const isReload = ref(false);
/**
 * 加载数据
 */
async function loadData(call?: (data?: Message[]) => void) {
  const roomId = chat.theContact.roomId;

  if (isLoading.value || isReload.value || pageInfo.value.isLast || !roomId)
    return;
  isLoading.value = true;
  isReload.value = false;
  getChatMessagePage(roomId, pageInfo.value.size, pageInfo.value.cursor, user.getToken).then(({ data }) => {
    if (roomId !== chat.theContact.roomId)
      return;
    // 追加数据
    if (data.list && data.list.length)
      chat.theContact.msgList.unshift(...data.list);
    const oldSize = chat.scrollTopSize;
    nextTick(() => {
      // 更新滚动位置
      chat.saveScrollTop && chat.saveScrollTop();
      if (pageInfo.value.cursor === null && !chat.theContact.msgList.length) { // 第一次加载默认没有动画
        chat.scrollBottom(false);
        call && call(chat.theContact.msgList);
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
function reload(roomId: number, timer = 40) {
  pageInfo.value = {
    cursor: null as null | string,
    isLast: false,
    size: 20,
  };
  chat.theContact.msgList.splice(0);
  chat.scrollTopSize = 0;
  if (isLoading.value || isReload.value)
    return;

  isReload.value = true;
  isLoading.value = true;
  getChatMessagePage(roomId, 20, null, user.getToken).then(({ data }) => {
    if (roomId !== chat.theContact.roomId)
      return;
    // 追加数据
    if (!data.list?.length)
      return;
    chat.theContact.msgList = data.list;
    pageInfo.value.isLast = data.isLast;
    pageInfo.value.cursor = data.cursor;
    nextTick(() => {
      setTimeout(() => {
      // 更新滚动位置
        chat.saveScrollTop && chat.saveScrollTop();
        chat.scrollBottom(false);
        isLoading.value = false;
        isReload.value = false;
      }, timer);
    });
  });
}

// 监听房间
watch(() => chat.theContact.roomId, (val) => {
  if (val) {
    reload(val);
    // 消息阅读上报
    chat.setReadList(val);
  }
}, {
  immediate: true,
});

/**
 * 新消息
 */
watch(() => ws.wsMsgList.newMsg.length, () => {
  // 1、新消息 type=1
  if (ws.wsMsgList.newMsg)
    resolveNewMsg(ws.wsMsgList.newMsg);
}, {
  immediate: true,
  deep: true,
});
/**
 * 撤回消息
 */
watch(() => ws.wsMsgList.recallMsg.length, () => {
  // 2、撤回消息
  resolveRevokeMsg(ws.wsMsgList.recallMsg);
}, {
  immediate: true,
  deep: true,
});
/**
 * 删除消息
 */
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
    if (!p)
      return;
    const body = getBody(p) || "";
    // 1）更新会话列表
    updateContact(p.message.roomId,
      {
        text: `${p.fromUser.nickName}：${body}`,
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

function getBody(msg: ChatMessageVO) {
  if (msg.message.type === MessageType.SOUND) {
    const _msg = msg as ChatMessageVO<SoundBodyMsgVO>;
    return `[语音] ${getSecondsText(_msg?.message?.body?.second || 0)}`;
  }
  return msg.message.content;
}
// 计算语音消息文本
function getSecondsText(second?: number) {
  if (!second)
    return "";
  if (second < 60) {
    return `${second}"`;
  }
  else if (second < 3600) {
    const minute = Math.floor(second / 60);
    const second_ = second % 60;
    return `${minute}'${second_}"`;
  }
}

/**
 * 撤回消息处理
 * @param list 列表
 */
function resolveRevokeMsg(list: WSMsgRecall[]) {
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (!p)
      return;

    if (p.roomId !== chat.theContact.roomId) {
      reloadContact(p.roomId);
      continue;
    }
    // 本房间修改状态
    const msg = findMsg(p.msgId);
    const msgContent = `${chat.theContact.type === RoomType.GROUP ? `${msg?.fromUser.nickName}:` : msg.fromUser.userId === user.userInfo.id ? "\"本人\"" : "\"对方\""}撤回了一条消息`;
    // 更新会话列表
    for (let k = 0; k < chat.contactList.length; k++) {
      const r = chat.contactList[k];
      if (r && r.roomId === p.roomId) {
        r.text = msgContent;
        break;
      }
    }
    // 消费消息
    ws.wsMsgList.recallMsg.splice(i, 1);
    if (msg) {
      msg.message.type = MessageType.RECALL;
      msg.message.content = msgContent;
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
    if (!p)
      return;

    if (p.roomId !== chat.theContact.roomId)
      continue;

    // 本房间修改状态
    const msg = findMsg(p.msgId);
    const msgContent = `${chat.theContact.type === RoomType.GROUP ? `${msg.fromUser.nickName}:` : msg.fromUser.userId === user.userInfo.id ? "\"本人\"" : "\"对方\""}删除了一条消息`;
    // 更新会话列表
    for (let k = 0; k < chat.contactList.length; k++) {
      const r = chat.contactList[k];
      if (r && p && r.roomId === p.roomId) {
        r.text = msgContent;
        break;
      }
    }
    // 消费消息
    ws.wsMsgList.deleteMsg.splice(i, 1);
    if (msg) {
      msg.message.type = MessageType.DELETE;
      msg.message.content = msgContent;
      msg.message.body = undefined;
      ws.wsMsgList.deleteMsg = ws.wsMsgList.deleteMsg.filter(k => k.msgId !== p.msgId);
    }
  }
}

// 更新会话
function updateContact(roomId: number, data: Partial<ChatContactVO>, isReload = false, callBack?: (contact: ChatContactVO) => void) {
  let isExist = false;
  if (UpdateContactList[roomId])
    return;
  UpdateContactList[roomId] = true;
  for (let i = 0; i < chat.contactList.length; i++) {
    const p = chat.contactList[i];
    if (p && p.roomId === roomId) {
      p.text = data.text || p.text;
      p.unreadCount = data.unreadCount || p.unreadCount;
      p.activeTime = data.activeTime || p.activeTime;
      p.avatar = data.avatar || p.avatar;
      callBack && callBack(p);
      isExist = true;
      break;
    }
  }
  if (!isExist)
    reloadContact(roomId);
}

// 重新加载会话列表
function reloadContact(roomId: number, callBack?: (contact: ChatContactVO) => void) {
  // 重新拉取会话
  getChatContactInfo(roomId, user.getToken)?.then((res) => {
    if (res.code === StatusCode.SUCCESS) {
      const index = chat.contactList.findIndex(ctx => ctx.roomId === roomId);
      if (index !== -1) { // 更新
        chat.contactList[index] = res.data;
      }
      else {
        chat.contactList.unshift(res.data as ChatContactVO); // 追加前置
      }
      callBack && callBack(res.data as ChatContactVO);
    }
  }).catch(() => {})
    .finally(() => {
      delete UpdateContactList[roomId];
    });
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
    relative
    v-bind="$attrs"
    flex
    flex-col
    class="msg-list op-0 transition-opacity transition-duration-50"
    :class="{ 'op-100 ': !isReload }"
  >
    <ListDisAutoIncre
      :auto-stop="false"
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
        :last-msg="i > 0 ? chat.theContact.msgList[i - 1] : {}"
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
.isReload {
  .animate {
    animation: none !important;
  }
}
</style>
