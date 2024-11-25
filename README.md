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

### 默认账号

- 账号：ikun233
- 密码：123456

注：该账号上传图片、修改密码等部分没有权限

### 功能列表

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
| 其他功能 | 全局夜间模式、字体、自定义下载路径、多系统支持、定制化设置等 | ✔ |

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

- 移动端适配

<div>
 <img src="./.doc/chat12.png" width = "190" style="display:inline-block;" alt="移动端适配" align=center />
 <img src="./.doc/chat13.png" width = "190" style="display:inline-block;" alt="移动端适配" align=center />
 <img src="./.doc/chat7.png" width = "190" style="display:inline-block;" alt="移动端适配" align=center />
 <img src="./.doc/chat8.png" width = "190" style="display:inline-block;" alt="移动端适配" align=center />
 <img src="./.doc/chat10.png" width = "190" style="display:inline-block;" alt="移动端适配" align=center />
 <img src="./.doc/chat11.png" width = "190" style="display:inline-block;" alt="移动端适配" align=center />
 <img src="./.doc/chat9.png" width = "190" style="display:inline-block;" alt="移动端适配" align=center />
</div>

## ⏳ 起步 | Project Setup

### 📦 安装依赖

```sh
# node 版本 >= 16
npm install -g pnpm

pnpm install
```

### ✨ 开发

修改`useBaseUrl.ts`文件，将`接口地址`改为你本地的接口地址或修改以下。

```ts
// useBaseUrl.ts
const isDev = !import.meta.env.DEV;
```

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

### 🌈 运行脚本 | Scripts

```sh
// 安装Husky，这是一个用于在Git钩子中运行脚本的工具
"prepare": "husky install",

// 运行Tauri命令
"tauri": "tauri",

// 开发Tauri桌面应用
"dev:tauri": "tauri dev",

// 开发桌面应用的快捷命令
"dev:desktop": "tauri dev",

// 开发Android平台的Tauri应用
"dev:android": "tauri android dev",

// 开发iOS平台的Tauri应用
"dev:ios": "tauri ios dev",

// 开发Nuxt.js应用，使用开发环境的.env文件，并监听主机变化
"dev:nuxt": "nuxt dev --dotenv .env.development --host",

// 开发Nuxt.js应用，使用生产环境的.env文件，并监听主机变化
"dev:nuxt:prod": "nuxt dev --dotenv .env.production --host",

// Nuxt.js预览模式
"preview": "nuxt preview",

// 构建项目，先使用Nuxi生成静态文件，然后构建Tauri应用
"build": "nuxi generate && tauri build",

// 仅构建Nuxt.js应用，使用生产环境的.env文件
"build:nuxt": "nuxi generate --dotenv .env.production",

// 构建Nuxt.js单页应用，使用生产环境的.env文件
"build:nuxt:spa": "nuxi build --dotenv .env.production",

// 构建Tauri应用
"build:tauri": "tauri build",

// 构建Android平台的Tauri应用，并生成APK文件
"build:android": "tauri android build --apk",

// 构建iOS平台的Tauri应用，并生成IPA文件
"build:ios": "tauri ios build --ipa",

// 发布版本，增加次要版本号，推送标签，拉取最新代码，推送到远程仓库
"release": "npm version minor && git push --tag && git fetch && git push",

// 发布主版本，增加主版本号，推送标签，拉取最新代码，推送到远程仓库
"release:major": "npm version major && git push --tag && git fetch && git push",

// 发布次要版本，增加次要版本号，推送标签，拉取最新代码，推送到远程仓库
"release:minor": "npm version minor && git push --tag && git fetch && git push",

// 发布补丁版本，增加补丁版本号，推送标签，拉取最新代码，推送到远程仓库
"release:patch": "npm version patch && git push --tag && git fetch && git push",

// 运行lint-staged，这是一个用于在Git暂存区运行linters的工具
"lint-staged": "lint-staged"
```
