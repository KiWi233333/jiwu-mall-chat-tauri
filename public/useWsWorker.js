let timer = null;
let status = null; // 用于存储状态
let lastHeartbeatTime = new Date(); // 上次心跳时间

// 监听来自主线程的初始化消息
self.onmessage = function (e) {
  const { status: newStatus, noticeType } = e.data;
  // 更新状态
  status = newStatus;
  // 发送日志消息
  self.postMessage({ type: "log", data: `Web Worker 初始化，ws状态：${status} ${noticeType}` });
  // 清理旧的定时器
  clearInterval(timer);

  // 如果状态不正常，直接通知主线程重新加载
  if (status !== 1) {
    self.postMessage({ type: "reload" });
    return;
  }

  // 启动心跳定时器
  timer = setInterval(() => {
    const now = new Date();
    const elapsedTime = now.getTime() - lastHeartbeatTime.getTime();
    // 发送心跳消息
    self.postMessage({ type: "heart", data: `${elapsedTime}ms` });
    // 更新上次心跳时间
    lastHeartbeatTime = now;
  }, 20000);
};
