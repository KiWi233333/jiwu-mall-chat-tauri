/**
 * @desc    Tauri2多窗口封装管理
 * @author: Kiwi2333
 * @time    2024.10
 */

import { listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getAllWindows, getCurrentWindow, type WindowOptions } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

// 创建窗口参数配置
export const windowConfig = {
  label: null, // 窗口唯一label
  title: "", // 窗口标题
  url: "", // 路由地址url
  width: 1000, // 窗口宽度
  height: 640, // 窗口高度
  minWidth: null, // 窗口最小宽度
  minHeight: null, // 窗口最小高度
  x: null, // 窗口相对于屏幕左侧坐标
  y: null, // 窗口相对于屏幕顶端坐标
  center: true, // 窗口居中显示
  resizable: true, // 是否支持缩放
  maximized: false, // 最大化窗口
  decorations: false, // 窗口是否装饰边框及导航条
  alwaysOnTop: false, // 置顶窗口
  dragDropEnabled: false, // 禁止系统拖放
  visible: false, // 隐藏窗口

  // ...
};

class Windows {
  mainWin: WebviewWindow | null;

  constructor() {
    // 主窗口
    this.mainWin = null;
  }

  // 创建新窗口
  async createWin(options: WebviewWindow) {
    console.log("------+开始创建窗口+------");

    const args = Object.assign({}, windowConfig, options) as WindowOptions & WebviewWindow;

    // 判断窗口是否存在
    const existWin = await this.getWin(args.label);
    if (existWin)
      console.log("窗口已存在>>", existWin);
    // ...

    // 创建窗口对象
    const win = new WebviewWindow(args.label, args as WindowOptions);

    // 窗口创建完毕/失败
    win.once("tauri://created", async () => {
      console.log("tauri://created");
      // 是否主窗口
      if (args.label.includes("main")) {
        // ...
      }

      // 是否最大化
      if (args.maximized && args.resizable) {
        console.log("is-maximized");
        await win.maximize();
      }
    });

    win.once("tauri://error", async (error) => {
      console.log("window create error!", error);
    });
  }

  // 获取窗口
  async getWin(label: string) {
    return await WebviewWindow.getByLabel(label);
  }

  // 获取全部窗口
  async getAllWin() {
    //  return getAll()
    return await getAllWindows();
  }

  // 开启主进程监听事件
  async listen() {
    console.log("——+——+——+——+——+开始监听窗口");

    // 创建新窗体
    await listen("win-create", (event) => {
      console.log(event);
      this.createWin(event.payload as WebviewWindow);
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

    // 关闭窗体
    await listen("win-close", async (event) => {
      await appWindow.close();
    });
  }
}

export default Windows;
