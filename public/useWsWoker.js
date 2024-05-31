let timer = null;
let time = new Date();
// 监听来自主线程的初始化消息
self.onmessage = function (e) {
  const { status, noticeType } = e.data;
  self.postMessage({ type: "log", data: `Web Worker 初始化，ws状态：${status} ${noticeType}` });

  timer = setInterval(() => {
    const newTime = new Date();
    if (status !== 1) {
      clearInterval(timer);
      timer = null;
      // 这里可以发送消息回主线程，通知主线程进行 reload()
      self.postMessage({ type: "reload" });
    }
    else {
      // 并通过某种方式在 Web Worker 中可用
      self.postMessage({ type: "heart", data: `${newTime.getTime() - time.getTime()}ms` });
    }
    time = newTime;
  }, 20000);
};
