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

### 介绍

极物聊天 Tauri APP 是一个基于Nuxt3 + Tauri + element-plus 基本框架的聊天桌面应用。它提供了一个美观的用户界面，并集成了聊天和社交功能。同时，它还支持AI购物聊天和全局夜间模式。用户可以通过该应用进行实时聊天、分享动态和AI客服问答。

### 技术

```txt
基于Nuxt3 + Tauri + element-plus 基本框架
```
### 趋势 

![JiwuChat Star History Chart](https://api.star-history.com/svg?repos=KiWi233333/jiwu-mall-chat-tauri&type=Date)

### 项目截图

- 聊天桌面应用 Login

![登录](./.doc/login.png)

- 聊天桌面应用 Chat

![主页](./.doc/chat.png)

- 全局夜间模式 Light / Dark

![暗黑](./.doc/chat1.png)

- 聊天社交

![暗黑](./.doc/chat2.png)

- AI购物聊天

![暗黑](./.doc/chat3.png)

- 账号与安全

![账号与安全](./.doc/chat4.png)

![账号与安全](./.doc/chat5.png)

- 响应式

<img src="./.doc/chat7.png" width = "200" alt="响应式" align=center />
<img src="./.doc/chat8.png" width = "200" alt="响应式" align=center />

## ⏳ 起步 | Project Setup

```sh
# node 版本 >= 16
npm install -g pnpm

pnpm install
```

### ✨ 开发

```sh
# 建议分开运行
# 1）启动nuxt
pnpm run dev:nuxt 
# 2）启动tauri
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

### 🔧 涉及技术栈 | Tech Stack

| 类别         | 技术/组件          | 版本号       |
| ------------- | ------------------ | ------------ |
| 框架         | Nuxt3              | ^3.12.2+       |
|              | Tauri              | ^1.5.6        |
| UI 组件库     | Element Plus       | 2.7.6        |
| 状态管理     | Pinia              | 2.1.7        |
| 工具库       | Vueuse             | 10.11.0      |
| 构建与开发工具 | Nuxi               | lts        |
|              | Vite               | lts         |
| 代码质量     | ESLint             | 8.56.0       |
|              | Prettier           | 3.3.2        |
| 类型检查     | TypeScript         | 5.3.2        |
| 样式处理     | Sass               | 1.77.6       |
