
<div align=center>
 <div align=center margin="10em" style="margin:4em 0 0 0;font-size: 30px;letter-spacing:0.3em;">
<img src="./.doc/jiwuchat-tauri.png" width="140px" height="140px" alt="Image Name" align=center />
 </div>
 <h2 align=center style="margin: 2em 0;">JiwuChat Tauri APP</h2>

<div>
      <a href="https://github.com/Kiwi233333/jiwu-mall-chat-tauri" target="_blank">
        <img class="disabled-img-view" src="https://img.shields.io/badge/Github-Project%20Address-blueviolet.svg?style=plasticr">
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

Language :  English | [中文](./README.md)
</div>

### Introduction

JiwuChat Tauri APP is a desktop chat application based on the Nuxt3 + Tauri + element-plus framework. It provides an aesthetically pleasing user interface and integrates chat and social features. It also supports AI shopping chat and global night mode. Users can use the app for real-time chat, share updates, and AI customer service Q&A.

### Technology

```txt
Based on the Nuxt3 + Tauri + element-plus framework
```

### Trends

![JiwuChat Star History Chart](https://api.star-history.com/svg?repos=KiWi233333/jiwu-mall-chat-tauri&type=Date)

### Default Account

- Account: ikun233
- Password: 123456

Note: This account does not have permissions for uploading images, changing passwords, etc.

### Feature List

| Feature Module | Feature Description | Status |
| --- | --- | --- |
| Login Registration Module | Supports login and registration with account, phone number, and email | ✔ |
| Messaging Module | Supports real-time chat with various message types including text, images, files, voice, video, etc. | ✔ |
| AI Shopping Module | AI shopping chat feature, providing product recommendations under "Jiwu Circle" | ✔ |
| Group Chat Module | Supports group chat and private chat in various chat modes | ✔ |
| Contact Module | Supports viewing, adding, and deleting contacts | ✔ |
| System Update Module | Supports automatic application updates | ✔ |
| Account and Security | Provides functions for account login, password change, account management, account online/offline, etc. | ✔ |
| Multi-System Support | Supports various systems including Windows, MacOS, Linux, etc. | ✔ |
| Other Features | Global night mode, font, customization settings, etc. | ✔ |

### Project Screenshots

- Chat Desktop App Login

![Login](./.doc/login.png)

- Chat Desktop App Chat

![Home](./.doc/chat.png)

- Global Night Mode Light / Dark

![Dark](./.doc/chat1.png)

- Chat Social

![Dark](./.doc/chat2.png)

- AI Shopping Chat

![Dark](./.doc/chat3.png)

- Account and Security

![Account and Security](./.doc/chat4.png)

![Account and Security](./.doc/chat5.png)

- Responsive

<img src="./.doc/chat7.png" width = "200" alt="Responsive" align=center />
<img src="./.doc/chat8.png" width = "200" alt="Responsive" align=center />

## ⏳ Getting Started | Project Setup

### 📦 Install Dependencies

```sh
# Node version >= 16
npm install -g pnpm

pnpm install
```

### ✨ Development

Modify the `useBaseUrl.ts` file to change the `API address` to your local API address or modify the following.

```ts
// useBaseUrl.ts
const isDev = !import.meta.env.DEV;
```

```sh
# It is recommended to run separately
# 1) Start nuxt
pnpm run dev:nuxt 
# 2) Start tauri
pnpm run dev:tauri 
```

### 📦 Package

```sh
pnpm run build:tauri
```

### ❌ pnpm install error

Check the source

```sh
pnpm get registry 
```

Temporary modification

```sh
pnpm --registry https://registry.npm.taobao.org install any-touch
```

Permanent use

```sh
pnpm config set registry https://registry.npm.taobao.org
```

Restore

```sh
pnpm config set registry https://registry.npmjs.org
```

### 🔧 Technology Stack | Tech Stack

| Category        | Technology/Component | Version       |
| --------------- | ------------------- | ------------ |
| Framework       | Nuxt3               | ^3.12.2+       |
|                 | Tauri               | ^2.0.0        |
| UI Component Library | Element Plus       | 2.7.6        |
| State Management | Pinia               | 2.1.7        |
| Utility Library  | Vueuse              | 10.11.0      |
| Build and Development Tools | Nuxi            | lts        |
|                  | Vite                | lts         |
| Code Quality    | ESLint              | 8.56.0       |
|                  | Prettier            | 3.3.2        |
| Type Checking   | TypeScript          | 5.3.2        |
| Style Processing| Sass                | 1.77.6       |
