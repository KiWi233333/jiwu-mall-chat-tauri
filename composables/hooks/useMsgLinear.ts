export function useMsgLinear() {
  function addListeners() {
    // 1、新消息 type=1
    mitter.on(MittEventType.MESSAGE, (data: ChatMessageVO) => {
      resolveNewMsg(data);
    });
    // 2、撤回消息 type=2
    mitter.on(MittEventType.RECALL, (data: WSMsgRecall) => {
      resolveRecallMsg(data);
    });
    // 3、删除消息 type=3
    mitter.on(MittEventType.DELETE, (data: WSMsgDelete) => {
      resolveDeleteMsg(data);
    });
    // 4、置顶会话消息 type=10 PIN_CONTACT
    mitter.on(MittEventType.PIN_CONTACT, (data: WSPinContactMsg) => {
      resolvePinContact(data);
    });
    // 5、ai推送消息 type=11
    mitter.on(MittEventType.AI_STREAM, (data: WSAiStreamMsg) => {
      resolveAiStream(data);
    });
  };

  // 移除监听
  function removeListeners() {
    mitter.off(MittEventType.MESSAGE);
    mitter.off(MittEventType.RECALL);
    mitter.off(MittEventType.DELETE);
    mitter.off(MittEventType.PIN_CONTACT);
    mitter.off(MittEventType.AI_STREAM);
  }

  // 监听
  onMounted(addListeners);
  onUnmounted(removeListeners);

  return {
    removeListeners,
  };
}


/**
 * 1. 新消息处理
 */
async function resolveNewMsg(msg: ChatMessageVO) {
  // body文本
  const body = resolveMsgContactText(msg) || "";
  const setting = useSettingStore();
  const chat = useChatStore();
  const user = useUserStore();
  const ws = useWsStore();
  // 1）更新会话列表
  chat.updateContact(msg.message.roomId, {
  }, (contact) => {
    // 添加未读数量
    if (msg.fromUser.userId !== user.userInfo.id)
      contact.unreadCount += 1;
    // 修改会话显示
    contact.text = contact.type === RoomType.GROUP ? `${msg.fromUser.nickName}: ${body}` : body;
    contact.lastMsgId = msg.message.id;
    contact.activeTime = Date.now();
    if (msg.message.roomId === chat.theContact.roomId && contact !== chat.theContact && msg.fromUser.userId !== user.userInfo.id) {
      chat.theContact.unreadCount += 1;
      chat.theContact.lastMsgId = msg.message.id;
      chat.theContact.activeTime = Date.now();
    }
  });
  // 2）更新消息列表
  if (msg.message.roomId !== chat.theContact.roomId || (setting.isMobileSize && !chat.isOpenContact)) {
    ws.wsMsgList.newMsg.splice(0);
    return;
  }
  chat.setReadList(chat.theContact.roomId);
  // 3）本房间追加消息
  const oldMsg = chat.findMsg(msg.message.id);
  if (!oldMsg) { // 说明是新消息
    chat.theContact.msgList.push(msg);
    msg.message.type === MessageType.RTC && handleRTCMsg(msg); // 处理rtc消息 多一步滚动
  }
  ws.wsMsgList.newMsg.splice(0);
}
// 2. 处理rtc消息
function handleRTCMsg(msg: ChatMessageVO) {
  const rtcMsg = msg.message.body as RtcLiteBodyMsgVO;
  const chat = useChatStore();
  const user = useUserStore();
  // 更新滚动位置
  if (msg.message.roomId === chat.theContact.roomId && rtcMsg.senderId === user.userInfo.id) {
    nextTick(() => {
      chat.scrollBottom(true);
    });
  }
}
/**
 * 3. 撤回消息处理
 * @param msg 消息
 */
function resolveRecallMsg(msg: WSMsgRecall) {
  if (!msg)
    return;
  const ws = useWsStore();
  const chat = useChatStore();
  const user = useUserStore();
  if (msg.roomId !== chat.theContact.roomId) {
    const ws = useWsStore();
    chat.reloadContact(msg.roomId);
    ws.wsMsgList.deleteMsg.splice(0);
    return;
  }
  // 本房间修改状态
  const oldMsg = chat.findMsg(msg.msgId);
  if (oldMsg) {
    if (msg.msgId === chat.theContact.lastMsgId) {
      // 更新会话列表显示文本
      const msgContent = `${oldMsg.fromUser.userId === user.userInfo.id ? "我" : `"${oldMsg.fromUser.nickName}"`}撤回了一条消息`;
      const targetContact = chat.contactMap[msg.roomId];
      if (targetContact)
        targetContact.text = msgContent;
      oldMsg.message.content = msgContent;
    }
    oldMsg.message.type = MessageType.RECALL;
    oldMsg.message.body = undefined;
    ws.wsMsgList.recallMsg = ws.wsMsgList.recallMsg.filter(k => k.msgId !== msg.msgId);
  }
  // 消费消息
  ws.wsMsgList.deleteMsg.splice(0);
}
/**
 * 4. 删除消息处理
 * @param msg 消息
 */
function resolveDeleteMsg(msg: WSMsgDelete) {
  if (!msg)
    return;
  const ws = useWsStore();
  const chat = useChatStore();
  const user = useUserStore();
  if (msg.roomId !== chat.theContact.roomId) {
    chat.reloadContact(msg.roomId);
    ws.wsMsgList.deleteMsg.splice(0);
    return;
  }
  // 本房间修改状态
  const oldMsg = chat.findMsg(msg.msgId);
  if (oldMsg) {
    // 更新会话显示文本
    if (msg.msgId === chat.theContact.lastMsgId) {
      const msgContent = `${msg.deleteUid === user.userInfo.id ? "我删除了一条消息" : `"${oldMsg.fromUser.nickName}"删除了一条成员消息`}`;
      const targetContact = chat.contactMap[msg.roomId];
      oldMsg.message.content = msgContent;
      if (targetContact)
        targetContact.text = msgContent;
    }
    // 修改旧消息
    oldMsg.message.type = MessageType.DELETE;
    oldMsg.message.body = undefined;
    ws.wsMsgList.deleteMsg = ws.wsMsgList.deleteMsg.filter(k => k.msgId !== msg.msgId);
  }
  // 消费消息
  ws.wsMsgList.deleteMsg.splice(0);
}
/**
 * 5. 置顶会话消息处理
 * @param data 数据
 */
export function resolvePinContact(data: WSPinContactMsg) {
  const chat = useChatStore();
  if (data.roomId !== chat.theContact.roomId) {
    chat.reloadContact(data.roomId);
    return;
  }
  // 本房间修改状态
  if (chat.contactMap[data.roomId]) {
    chat.contactMap[data.roomId]!.pinTime = data.pinTime;
  }
  else { // 主动拉取
    chat.reloadContact(data.roomId);
  }
}
/**
 * 6. ai推送消息处理
 * @param data 数据
 */
function resolveAiStream(data: WSAiStreamMsg) {
  const chat = useChatStore();
  const contact = chat.contactMap[data.roomId];
  if (!contact)
    return;
  if (data.roomId !== chat.theContact.roomId) { // 修改会话
    if (contact?.lastMsgId !== data.msgId)
      return;
    // 修改content内容
    if (contact.text === "...") { // 初始状态
      contact.text = "";
    }
    if (data.status === AiReplyStatusEnum.IN_PROGRESS)
      contact.text += data.content;
    else
      contact.text = data.content;
    return;
  }
  // 本房间修改状态
  if (data.status === AiReplyStatusEnum.IN_PROGRESS)
    contact.text += data.content;
  else
    contact.text = data.content;
  chat.theContact.text = contact?.text;

  const oldMsg = chat.findMsg(data.msgId);
  if (oldMsg) {
    if (data.status === AiReplyStatusEnum.IN_PROGRESS) {
      oldMsg.message.content += data.content;
      if (!oldMsg.message.body.reasoningContent) {
        oldMsg.message.body.reasoningContent = "";
      }
      oldMsg.message.body.reasoningContent += data.reasoningContent || "";
    }
    else {
      oldMsg.message.content = data.content;
      oldMsg.message.body.reasoningContent = data.reasoningContent || "";
    }
    // await nextTick();
    // scrollBottom(true);
  }
}
