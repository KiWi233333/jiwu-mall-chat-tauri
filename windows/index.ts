/**
 * @desc    窗口容器
 * @author: Kiwi23333
 * @time    2024.5.4
 */

import { WebviewWindow, type WindowOptions, appWindow, getAll, getCurrent } from "@tauri-apps/api/window";
import { exit, relaunch } from "@tauri-apps/api/process";
import { emit, listen } from "@tauri-apps/api/event";

import { setWin } from "./actions";

// 系统参数配置
export const windowConfig = {
  label: null, // 窗口唯一label
  title: "", // 窗口标题
  url: "", // 路由地址url
  width: 900, // 窗口宽度
  height: 640, // 窗口高度
  minWidth: null, // 窗口最小宽度
  minHeight: null, // 窗口最小高度
  x: null, // 窗口相对于屏幕左侧坐标
  y: null, // 窗口相对于屏幕顶端坐标
  center: true, // 窗口居中显示
  resizable: true, // 是否支持缩放
  maximized: false, // 最大化窗口
  decorations: false, // 窗口是否无边框及导航条
  alwaysOnTop: false, // 置顶窗口
};

class Windows {
  mainWin: WebviewWindow | null; // 主窗口对象

  // 构造器
  constructor() {
    this.mainWin = null;
  }

  // 获取窗口
  getWin(label: string) {
    return WebviewWindow.getByLabel(label);
  }

  // 获取全部窗口
  getAllWin() {
    return getAll();
  }

  // 创建新窗口
  async createWin(options: WindowOptions) {
    const args = Object.assign({}, windowConfig, options) as WindowOptions;

    // 判断窗口是否存在
    const existWin = getAll().find(w => w.label === args.label);
    if (existWin) {
      if (!existWin.label.includes("main")) {
        await existWin?.unminimize();
        await existWin?.setFocus();
        return;
      }
      await existWin?.close();
    }

    // 创建窗口对象
    const win = new WebviewWindow(args.label, args);

    // 是否最大化
    if (args.maximized && args.resizable)
      win.maximize();


    // 窗口创建完毕/失败
    win.once("tauri://created", async () => {
      console.log("window create success!");
    });

    win.once("tauri://error", async () => {
      console.log("window create error!");
    });
  }

  // 开启主进程监听事件
  async listen() {
    // 创建新窗体
    await listen("win-create", (event) => {
      console.log(event);
      this.createWin(JSON.parse(event.payload as string));
    });

    // 显示窗体
    await listen("win-show", async (event) => {
      if (!appWindow.label.includes("main"))
        return;
      await appWindow.show();
      await appWindow.unminimize();
      await appWindow.setFocus();
    });

    // 隐藏窗体
    await listen("win-hide", async (event) => {
      if (!appWindow.label.includes("main"))
        return;
      await appWindow.hide();
    });

    // 退出应用
    await listen("win-exit", async (event) => {
      setWin("logout");
      await exit();
    });

    // 重启应用
    await listen("win-relaunch", async (event) => {
      await relaunch();
    });

    // 主/渲染进程传参
    await listen("win-setdata", async (event) => {
      await emit("win-postdata", JSON.parse(event.payload as string));
    });
  }
}

export default Windows;
