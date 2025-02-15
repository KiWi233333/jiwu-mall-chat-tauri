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
  const targetCtx = chat.contactMap?.[msg.message.roomId];
  chat.updateContact(msg.message.roomId, {
  }, (contact) => {
    // 添加未读数量
    if (msg.fromUser.userId !== user.userInfo.id)
      contact.unreadCount += 1;
    // 修改会话显示
    contact.text = contact.type === RoomType.GROUP ? `${msg.fromUser.nickName}: ${body}` : body;
    contact.lastMsgId = msg.message.id;
    contact.activeTime = Date.now();
  });
  if (!targetCtx) {
    ws.wsMsgList.newMsg.splice(0);
    return;
  }
  // 2）更新消息列表
  if (msg.message.roomId !== targetCtx.roomId || (setting.isMobileSize && !chat.isOpenContact)) {
    ws.wsMsgList.newMsg.splice(0);
  }
  else if (msg.message.roomId === chat.theContactId) { // 阅读消息
    chat.setReadList(targetCtx.roomId);
  }
  // 3）本房间追加消息
  // const oldMsg = chat.findMsg(msg.message.roomId, msg.message.id);
  // if (!oldMsg) { // 说明是新消息
  //   targetCtx.msgList.push(msg);
  //   msg.message.type === MessageType.RTC && handleRTCMsg(msg); // 处理rtc消息 多一步滚动
  // }
  chat.appendMsg(msg); // 追加消息
  msg.message.type === MessageType.RTC && msg.message.roomId === chat.theContactId && handleRTCMsg((msg as any)); // 处理rtc消息 多一步滚动
  ws.wsMsgList.newMsg.splice(0);
}
/**
 * 2. 撤回消息处理
 * @param msg 消息
 */
function resolveRecallMsg(msg: WSMsgRecall) {
  if (!msg)
    return;
  const ws = useWsStore();
  const chat = useChatStore();
  const user = useUserStore();
  // 本房间修改状态
  const oldMsg = chat.findMsg(msg.roomId, msg.msgId);
  if (oldMsg) {
    // 更新会话列表显示文本
    const msgContent = `${oldMsg.fromUser.userId === user.userInfo.id ? "我" : `"${oldMsg.fromUser.nickName}"`}撤回了一条消息`;
    const targetContact = chat.contactMap[msg.roomId];
    if (msg.msgId === targetContact?.lastMsgId) { // 最后一条消息
      targetContact.text = msgContent;
    }
    oldMsg.message.content = msgContent;
    oldMsg.message.type = MessageType.RECALL;
    oldMsg.message.body = undefined;
  }
  // 消费消息
  ws.wsMsgList.recallMsg = ws.wsMsgList.recallMsg.filter(k => k.msgId !== msg.msgId);
}
/**
 * 3. 删除消息处理
 * @param msg 消息
 */
function resolveDeleteMsg(msg: WSMsgDelete) {
  if (!msg)
    return;
  const ws = useWsStore();
  const chat = useChatStore();
  const user = useUserStore();
  const oldMsg = chat.findMsg(msg.roomId, msg.msgId);
  if (oldMsg) {
    // 更新会话显示文本
    const targetContact = chat.contactMap[msg.roomId];
    if (targetContact && msg.msgId === targetContact.lastMsgId) { // 最后一条消息
      const msgContent = `${msg.deleteUid === user.userInfo.id ? "我删除了一条消息" : `"${oldMsg.fromUser.nickName}"删除了一条成员消息`}`;
      oldMsg.message.content = msgContent;
      targetContact.text = msgContent;
    }
    // 修改旧消息
    oldMsg.message.type = MessageType.DELETE;
    oldMsg.message.body = undefined;
  }
  // 消费消息
  ws.wsMsgList.deleteMsg = ws.wsMsgList.deleteMsg.filter(k => k.msgId !== msg.msgId);
}
/**
 * 4. 置顶会话消息处理
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
// 5. 处理rtc消息
function handleRTCMsg(msg: ChatMessageVO<RtcLiteBodyMsgVO>) {
  const rtcMsg = msg.message.body;
  if (!rtcMsg)
    return;
  const chat = useChatStore();
  const user = useUserStore();
  const targetCtx = chat.contactMap?.[msg.message.roomId];
  // 更新滚动位置
  if (targetCtx && msg.message.roomId === targetCtx.roomId && rtcMsg.senderId === user.userInfo.id) {
    nextTick(() => {
      chat.scrollBottom(true);
    });
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
  const oldMsg = chat.findMsg(data.roomId, data.msgId) as ChatMessageVO<AiChatReplyBodyMsgVO> | undefined;
  // 本房间修改状态
  oldMsg?.message?.body && (oldMsg.message.body.status = data.status); // 修改消息状态
  if (data.status === AiReplyStatusEnum.IN_PROGRESS) {
    contact.text += data.content;
    if (oldMsg) {
      oldMsg.message.content += data.content;
      if (!oldMsg.message.body?.reasoningContent) {
        oldMsg.message.body = {
          reasoningContent: "",
        } as AiChatReplyBodyMsgVO;
      }
      oldMsg.message.body.reasoningContent += data.reasoningContent || "";
    }
  }
  else if (contact.text === "..." && data.status === AiReplyStatusEnum.START) { // 初始状态
    contact.text = "";
  }
  else {
    contact.text = data.content.substring(0, 100); // 裁切100字
    if (oldMsg) {
      oldMsg.message.content = data.content;
      if (!oldMsg.message.body?.reasoningContent) {
        oldMsg.message.body = {
          reasoningContent: "",
        } as AiChatReplyBodyMsgVO;
      }
      oldMsg.message.body!.reasoningContent = data.reasoningContent || "";
    }
  }

  // // 更新消息
  // if (oldMsg?.message?.body) {
  //   if (data.status === AiReplyStatusEnum.IN_PROGRESS) {
  //     oldMsg.message.content += data.content;
  //     if (!oldMsg?.message?.body?.reasoningContent) {
  //       oldMsg.message.body.reasoningContent = "";
  //     }
  //     oldMsg.message.body.reasoningContent += data.reasoningContent || "";
  //   }
  //   else {
  //     oldMsg.message.content = data.content;
  //     oldMsg.message.body.reasoningContent = data.reasoningContent || "";
  //   }
  //   oldMsg.message.body.status = data.status; // 修改消息状态
  // }
}
