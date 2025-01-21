<div align=center>
 <div align=center margin="10em" style="margin:4em 0 0 0;font-size: 30px;letter-spacing:0.3em;">
<img src="./.doc/jiwuchat-tauri.png" width="140px" height="140px" alt="图片名称" align=center />
 </div>
 <h2 align=center style="margin: 2em 0;">极物聊天 Tauri APP</h2>

<div>
      <a href="https://github.com/Kiwi233333/jiwu-mall-chat-tauri" target="_blank">
        <img class="disabled-img-view" src="https://img.shields.io/badge/Github-项目地址-blueviolet.svg?style=plasticr">
      </a>
      <a href="https://github.com/Kiwi233333/jiwu-mall-chat-tauri/stargazers" target="_blank">
        <img class="disabled-img-view" alt="License"
          src="https://img.shields.io/github/stars/Kiwi233333/jiwu-mall-chat-tauri.svg?style=social">
      </a>
    </div>
    <div >
      <a href="https://github.com/Kiwi233333/jiwu-mall-chat-tauri/commits" target="_blank">
        <img class="disabled-img-view" alt="Commit"
          src="https://img.shields.io/github/commit-activity/m/Kiwi233333/jiwu-mall-chat-tauri">
      </a>
      <a href="https://github.com/Kiwi233333/jiwu-mall-chat-tauri/issues" target="_blank">
        <img class="disabled-img-view" alt="Issues" src="https://img.shields.io/github/issues/Kiwi233333/jiwu-mall-chat-tauri">
      </a>
      <a href="https://github.com/Kiwi233333/jiwu-mall-chat-tauri/blob/master/LICENSE" target="_blank">
        <img class="disabled-img-view" alt="License: Apache-2.0"
          src="https://img.shields.io/badge/License-Apache--2.0-blue.svg">
      </a>
    </div>

语言 : 简体中文 | [English](./README.en.md)
</div>

## 介绍

极物聊天 Tauri APP 是一个基于Nuxt3 + Tauri + element-plus 基本框架的聊天桌面应用。它提供了一个美观的用户界面，并集成了聊天和社交功能。同时，它还支持AI购物聊天和全局夜间模式。用户可以通过该应用进行实时聊天、分享动态和AI客服问答。

## 一套代码，多端适配

![多端适配](.doc/previews.png)

## 默认账号

- 账号：ikun233
- 密码：123456

注：该账号上传图片、修改密码等部分没有权限

## 功能列表

| 功能模块 | 功能描述 | 状态 |
| --- | --- | --- |
| 用户模块 | 支持账号、手机号和邮箱的登录和注册 | ✔ |
| 消息模块 | 支持文本、图片、文件、语音、@用户、撤回、删除等多种消息类型的实时聊天功能 | ✔ |
| 会话模块 | 支持群聊、私聊多种聊天模式，群主、管理员、普通用户等角色 | ✔ |
| 联系人模块 | 支持查看、添加、删除联系人 | ✔ |
| 系统版本模块 | 支持应用的自动更新、查看版本公告等 | ✔ |
| 账号与安全模块 | 提供账号登录、修改密码、账号管理、设备安全、账号上下线等功能 | ✔ |
| AI购物模块 | AI购物聊天功能，提供`极物圈`下的商品推荐 | ✔ |
| 文件下载管理模块 | 支持文件本地下载、打开、删除等功能 | ✔ |
| 语音视频模块 | 基于WebRTC的共享屏幕、语音、视频聊天功能 | ✔ |
| 其他功能 | 全局夜间模式、字体、自定义下载路径、多系统支持、定制化设置等 | ✔ |

## 项目截图

- 聊天桌面应用 Login

![登录](./.doc/login.png)

- 聊天桌面应用 Chat

![主页](./.doc/chat.png)

- 全局夜间模式 Light / Dark

![暗黑](./.doc/chat1.png)

- 语音视频聊天 WebRTC

![语音视频聊天](./.doc/rtc1.png)

- 屏幕共享

![屏幕内容共享](./.doc/rtc3.png)

- 聊天社交

![暗黑](./.doc/chat2.png)

- AI购物聊天

![暗黑](./.doc/chat3.png)

- 账号与安全

![账号与安全](./.doc/chat4.png)

![账号与安全](./.doc/chat5.png)

- 移动端适配

<div>
 <img src="./.doc/chat12.png" width = "190" style="display:inline-block;" alt="移动端适配" align=center />
 <img src="./.doc/chat13.png" width = "190" style="display:inline-block;" alt="移动端适配" align=center />
 <img src="./.doc/chat7.png" width = "190" style="display:inline-block;" alt="移动端适配" align=center />
 <img src="./.doc/rtc2.png" width = "190" style="display:inline-block;" alt="移动端适配" align=center />
 <img src="./.doc/rtc_remove_desktop.png" width = "190" style="display:inline-block;" alt="移动端适配" align=center />
 <img src="./.doc/chat8.png" width = "190" style="display:inline-block;" alt="移动端适配" align=center />
 <img src="./.doc/chat10.png" width = "190" style="display:inline-block;" alt="移动端适配" align=center />
 <img src="./.doc/chat11.png" width = "190" style="display:inline-block;" alt="移动端适配" align=center />
 <img src="./.doc/chat9.png" width = "190" style="display:inline-block;" alt="移动端适配" align=center />
</div>

## ⏳ 起步

### 📦 安装依赖

```sh
# node 版本 >= 18
npm install -g pnpm

pnpm install
```

### ✨ 开发

- 若有后端服务，可采用自定义修改开发`.env.development`环境变量文件进行开发

```sh
# 建议分开运行
# 终端1：启动nuxt
pnpm run dev:nuxt
# 终端2：启动tauri
pnpm run dev:tauri
```
- 若没有后端服务，修改`.env.development`环境变量，或使用`.env.production`配置文件。

```sh
# 终端1：启动nuxt (发布环境)
pnpm run prod:nuxt
# 终端2：启动tauri
pnpm run dev:tauri
```

### 📦 打包

```sh
pnpm run build:tauri
```

### ❌ pnpm install error

查看源

```sh
pnpm get registry
```

临时修改

```sh
pnpm --registry https://registry.npm.taobao.org install any-touch
```

持久使用

```sh
pnpm config set registry https://registry.npm.taobao.org
```

还原

```sh
pnpm config set registry https://registry.npmjs.org
```

## 🔧 涉及技术栈 | Tech Stack

| 类别         | 技术/组件          | 版本号       |
| ------------- | ------------------ | ------------ |
| 框架         | Nuxt3              | ^3.14.159+       |
|                 | Tauri               | ^2.1.0        |
| UI 组件库     | Element Plus       | ^2.8.4        |
| 状态管理     | Pinia              | 2.1.7        |
| 工具库       | Vueuse             | 10.11.0      |
| 构建与开发工具 | Nuxi               | lts        |
|              | Vite               | lts         |
| 代码质量     | ESLint             | 8.56.0       |
|              | Prettier           | 3.3.2        |
| 类型检查     | TypeScript         | 5.3.2        |
| 样式处理     | Sass               | 1.77.6       |

## 🦾  趋势

![JiwuChat Star History Chart](https://api.star-history.com/svg?repos=KiWi233333/jiwu-mall-chat-tauri&type=Date)

## 💬 联系方式 | Contact

- 邮箱：[kiwi2333@qq.com](mailto:kiwi2333@qq.com)
- QQ: [1329634286](https://wpa.qq.com/msgrd?v=3&uin=1329634286&site=qqq&menu=yes)
