<div align=center>
 <div align=center margin="10em" style="margin:4em 0 0 0;font-size: 30px;letter-spacing:0.3em;">
<img src="./.doc/jiwuchat-tauri.png" width="140px" height="140px" alt="Image Name" align=center />
 </div>
 <h2 align=center style="margin: 2em 0;">JiwuChat Tauri APP</h2>

<div>
      <a href="https://github.com/Kiwi233333/jiwu-mall-chat-tauri" target="_blank">
        <img class="disabled-img-view" src="https://img.shields.io/badge/Github-Project%20Address-blueviolet.svg?style=plastic">
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
          src="https://img.shields.io/badge/License-Apache%20-2.0-blue.svg">
      </a>
    </div>

Language: Simplified Chinese | [English](./README.en.md)
</div>

### Introduction

JiwuChat Tauri APP is a desktop chat application based on the Nuxt3 + Tauri + Element Plus framework. It provides an aesthetically pleasing user interface and integrates chat and social features. Additionally, it supports AI shopping chat and a global dark mode. Users can engage in real-time chatting, share updates, and interact with AI customer service through this app.

### Technology

```txt
Based on the Nuxt3 + Tauri + Element Plus framework
```

### Trends

![JiwuChat Star History Chart](https://api.star-history.com/svg?repos=KiWi233333/jiwu-mall-chat-tauri&type=Date)

### Default Account

- Username: ikun233
- Password: 123456

Note: This account does not have permissions for uploading images or changing passwords.

### Feature List

| Feature Module | Description | Status |
| --- | --- | --- |
| User Module | Supports login and registration via account, phone number, and email | ✔ |
| Messaging Module | Supports real-time chat with various message types including text, images, files, voice, @mentions, recall, and deletion | ✔ |
| AI Shopping Module | AI shopping chat feature providing product recommendations under "Jiwu Circle" | ✔ |
| Conversation Module | Supports group and private chats with roles such as group owner, admin, and regular user | ✔ |
| Contact Module | Supports viewing, adding, and deleting contacts | ✔ |
| System Version Module | Supports automatic app updates and viewing version announcements | ✔ |
| Account & Security Module | Offers features like account login, password change, account management, device security, and account online/offline status | ✔ |
| File Download Management Module | Supports local file download, opening, and deletion | ✔ |
| Other Features | Global dark mode, font customization, custom download paths, multi-system support, and customizable settings | ✔ |

### Project Screenshots

- Chat Desktop App Login

![Login](./.doc/login.png)

- Chat Desktop App Chat

![Home](./.doc/chat.png)

- Global Dark Mode Light / Dark

![Dark](./.doc/chat1.png)

- Chat Social

![Dark](./.doc/chat2.png)

- AI Shopping Chat

![Dark](./.doc/chat3.png)

- Account & Security

![Account & Security](./.doc/chat4.png)

![Account & Security](./.doc/chat5.png)

- Responsiveness

<img src="./.doc/chat7.png" width="200" alt="Responsive" align=center />
<img src="./.doc/chat8.png" width="200" alt="Responsive" align=center />

## ⏳ Getting Started | Project Setup

### 📦 Install Dependencies

```sh
# Node version >= 16
npm install -g pnpm

pnpm install
```

### ✨ Development

Modify the `useBaseUrl.ts` file to change the `API address` to your local API address or adjust the following.

```ts
// useBaseUrl.ts
const isDev = !import.meta.env.DEV;
```

```sh
# It is recommended to run separately
# 1) Start Nuxt
pnpm run dev:nuxt 
# 2) Start Tauri
pnpm run dev:tauri 
```

### 📦 Build

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

| Category | Technology/Component | Version |
| ------------- | ------------------ | ------------ |
| Framework | Nuxt3 | ^3.12.2+ |
| Framework | Tauri | ^2.0.0 |
| UI Component Library | Element Plus | 2.7.6 |
| State Management | Pinia | 2.1.7 |
| Utility Library | Vueuse | 10.11.0 |
| Build & Development Tools | Nuxi | lts |
| Build & Development Tools | Vite | lts |
| Code Quality | ESLint | 8.56.0 |
| Code Quality | Prettier | 3.3.2 |
| Type Checking | TypeScript | 5.3.2 |
| Style Processing | Sass | 1.77.6 |
