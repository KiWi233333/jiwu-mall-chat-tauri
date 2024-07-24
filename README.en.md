<div align=center>
 <h1 align=center margin="10em" style="margin:4em 0 0 0;font-size: 30px;letter-spacing:0.3em;">
<img src="./.doc/jiwuchat-tauri.png" width = "120" height = "120" alt="图片名称" align=center />
 </h1>
 <h2 align=center style="font-size: 22px;">Jiwu Chat Tauri APP</h2>

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

Language : English | [简体中文](./README.md)

</div>

### Introduction

Jiwu Chat Tauri APP is a chat desktop application based on the Nuxt3 + Tauri + element-plus basic framework. It provides a beautiful user interface and integrates chat and social functions. At the same time, it supports AI shopping chat and global dark mode. Users can use the app for real-time chat, share dynamic and AI customer service questions and answers.

### Technology

```txt
Based on Nuxt3 + Tauri + element-plus basic framework
```

### Project Screenshots

- Chat Desktop Application Login

![登录](./.doc/login.png)

- Chat Desktop Application Chat

![主页](./.doc/chat.png)

- Global Dark Mode Light / Dark

![暗黑](./.doc/chat1.png)

- Chat Social

![暗黑](./.doc/chat2.png)

- AI Shopping Chat

![暗黑](./.doc/chat3.png)

- Account and Security

![账号与安全](./.doc/chat4.png)

![账号与安全](./.doc/chat5.png)

- Responsive

<img src="./.doc/chat7.png" width = "200" alt="响应式" align=center /><img src="./.doc/chat8.png" width = "200" alt="响应式" align=center />

## ⏳ Project Setup

```sh
# node version >= 16
npm install -g pnpm

pnpm install
```

### ✨ Development

```sh
# It is recommended to run separately
# 1) Start nuxt
pnpm run dev:nuxt 
# 2) Start tauri
pnpm run dev:tauri 
```

### 📦 Packaging

```sh
pnpm run build
```

or

```sh
# First build nuxt, then build tauri
pnpm run build:nuxt

pnpm run build:tauri
```

### ❌ pnpm install error

View source

```sh
pnpm get registry 
```

Temporary modification

```sh
pnpm --registry https://registry.npm.taobao.org install any-touch
```

Persistent use

```sh
pnpm config set registry https://registry.npm.taobao.org
```

Restore

```sh
pnpm config set registry https://registry.npmjs.org
```

### 🔧 Tech Stack

| Category         | Technology/Component   | Version Number   |
| --------------------- | ---------------------- | ---------------- |
| Framework        | Nuxt3                 | 3.12.2          |
|                 | Tauri                 | 1.5.6            |
| UI Component | Element Plus         | 2.7.6           |
| State Management  | Pinia                 | 2.1.7           |
| Toolkit         | Vueuse                | 10.11.0         |
| Build and Development Tools | Nuxi               | lts            |
|                 | Vite                  | lts             |
| Code Quality     | ESLint                | 8.56.0          |
|                 | Prettier               | 3.3.2           |
| Type Checking    | TypeScript            | 5.3.2           |
| Style Handling   | Sass                  | 1.77.6          |
