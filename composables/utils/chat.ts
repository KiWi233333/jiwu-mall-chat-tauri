// utils/chat.ts

/**
 * 解析消息内容（会话文本）
 * @param msg 消息
 * @returns 消息内容
 */
export function resolveMsgContactText(msg: ChatMessageVO): string {
  if (msg.message.type === MessageType.SOUND) {
    const _msg = msg as ChatMessageVO<SoundBodyMsgVO>;
    return `[语音] ${getSecondsText(_msg?.message?.body?.second || 0)}`;
  }
  else if (msg.message.type === MessageType.IMG) {
    const _msg = msg as ChatMessageVO<ImgBodyMsgVO>;
    return `[图片] ${_msg?.message.content}`;
  }
  else if (msg.message.type === MessageType.FILE) {
    const _msg = msg as ChatMessageVO<FileBodyMsgVO>;
    return `[文件] ${_msg.message.body?.fileName} ${_msg?.message.content}`;
  }
  else if (msg.message.type === MessageType.VIDEO) {
    const _msg = msg as ChatMessageVO<ImgBodyMsgVO>;
    return `[视频] ${_msg?.message.content}`;
  }
  else if (msg.message.type === MessageType.RTC) {
    const _msg = msg as ChatMessageVO<RtcLiteBodyMsgVO>;
    return `[${_msg.message.body?.typeText || "通讯聊天"}] ${_msg?.message.content}`;
  }
  // 其他类型消息
  return msg.message.content || "";
}
/**
 * 解析消息内容（回复文本）
 * @param msg 消息
 * @returns 消息内容
 */
export function resolveMsgReplyText(msg: ChatMessageVO): string | undefined | null {
  if (msg.message.type === MessageType.SOUND) {
    const _msg = msg as ChatMessageVO<SoundBodyMsgVO>;
    return `[语音] ${getSecondsText(_msg?.message?.body?.second || 0)}`;
  }
  else if (msg.message.type === MessageType.IMG) {
    const _msg = msg as ChatMessageVO<ImgBodyMsgVO>;
    return `[图片] ${_msg?.message.content}`;
  }
  else if (msg.message.type === MessageType.FILE) {
    const _msg = msg as ChatMessageVO<FileBodyMsgVO>;
    return `[文件] ${_msg.message.body?.fileName} ${_msg?.message.content}`;
  }
  else if (msg.message.type === MessageType.VIDEO) {
    const _msg = msg as ChatMessageVO<ImgBodyMsgVO>;
    return `[视频] ${_msg?.message.content}`;
  }
  else if (msg.message.type === MessageType.RTC) {
    const _msg = msg as ChatMessageVO<RtcLiteBodyMsgVO>;
    return `[${_msg.message.body?.typeText || "通讯聊天"}] ${_msg?.message.content}`;
  }
  // 其他类型消息
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
