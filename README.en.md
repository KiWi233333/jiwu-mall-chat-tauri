<div align=center>
 <div align=center margin="10em" style="margin:4em 0 0 0;font-size: 30px;letter-spacing:0.3em;">
<img src="./.doc/jiwuchat-tauri.png" width="140px" height="140px" alt="Image Name" align=center />
 </div>
 <h2 align=center style="margin: 2em 0;">JiwuChat Tauri APP</h2>


<div>
      <a href="https://github.com/Kiwi233333/jiwu-mall-chat-tauri" target="_blank">
        <img class="disabled-img-view" src="https://img.shields.io/badge/Github-JiwuChat-blueviolet.svg?style=plasticr">
      </a>
      <a href="https://github.com/Kiwi233333/jiwu-mall-chat-tauri/stargazers" target="_blank">
        <img class="disabled-img-view" alt="License"
          src="https://img.shields.io/github/stars/Kiwi233333/jiwu-mall-chat-tauri.svg?style=social">
      </a>
    </div>
    <div>
      <a href="https://github.com/Kiwi233333/jiwu-mall-chat-tauri/commits" target="_blank">
        <img class="disabled-img-view" alt="Commit"
          src="https://img.shields.io/github/commit-activity/m/Kiwi233333/jiwu-mall-chat-tauri">
      </a>
      <a href="https://github.com/Kiwi233333/jiwu-mall-chat-tauri/issues" target="_blank">
        <img class="disabled-img-view" alt="Issues" src="https://img.shields.io/github/issues/Kiwi233333/jiwu-mall-chat-tauri">
      </a>
    </div>
    <div>
      <a href="https://app.netlify.com/sites/jiwuchat/deploys" target="_blank">
          <img src="https://api.netlify.com/api/v1/badges/b68ad9ac-53e5-4c5a-ac56-a8882ffe7697/deploy-status" alt="+QQ群"/>
      </a>
      <a href="`https://github.com/Kiwi233333/jiwu-mall-chat-tauri/blob/main/LICENSE`" target="_blank">
          <img class="disabled-img-view" alt="License"
          src="https://img.shields.io/github/license/Kiwi233333/jiwu-mall-chat-tauri">
      </a>
    </div>

Language: English | [Simplified Chinese](./README.md)
</div>

## Introduction

JiwuChat is a lightweight (~10MB) multi-platform chat app built with Tauri2 and Nuxt3, featuring real-time messaging, WebRTC audio and video calls, screen sharing, and AI shopping. It offers seamless cross-device communication with text, image, file, and voice messaging, as well as group chats and customizable settings. Available in light and dark modes for efficient social networking. ✨

## One Code, Multi-platform Support

![Multi-platform Support](.doc/previews.png)

## Default Account

- Account: ikun233
- Password: 123456
- Experience: [Web Address](https://chat.jiwu.kiwi233.top/)

Note: This account does not have permissions for uploading images, changing passwords, etc.

## Feature List

| Feature Module | Description | Status |
| --- | --- | --- |
| User Module | Supports login and registration with account, phone number, and email | ✔ |
| Message Module | Supports real-time chat with text, images, files, voice, @users, retract, delete, and other message types | ✔ |
| Conversation Module | Supports group chat, private chat, and various roles such as group owner, administrator, and ordinary user | ✔ |
| Contact Module | Supports viewing, adding, and deleting contacts | ✔ |
| System Version Module | Supports automatic app updates and viewing version announcements | ✔ |
| Account & Security Module | Provides functions for account login, password change, account management, device security, and account online/offline | ✔ |
| AI Shopping Module | AI shopping chat feature, providing product recommendations under "Jiwu Circle" | ✔ |
| File Download Management Module | Supports local file download, open, and delete functions | ✔ |
| Voice and Video Module | Based on WebRTC for Screen Share, voice and video chat functionality | ✔ |
| Other Features | Global dark mode, font, custom download path, multi-system support, customized settings, etc. | ✔ |

## Project Screenshots 📸

- Chat Desktop Application Login

![Login](./.doc/login.png)

<!-- ![Register](./.doc/register.png) -->

- Chat Desktop Application Chat

![Light Mode](./.doc/chat1.png)

- Global Light / Dark Mode

![Home Page](./.doc/chat.png)

- Voice and Video Chat via WebRTC

![Voice and Video Chat](./.doc/rtc1.png)

- Screen Sharing

![Screen Content Sharing](./.doc/rtc3.png)

- Chat and Social Interaction

![Dark Mode](./.doc/chat2.png)

- AI Shopping Chat

![Dark Mode](./.doc/chat3.png)

![Dark Mode](./.doc/chat3.2.png)

- Account and Security

![Account and Security](./.doc/chat4.png)

![Account and Security](./.doc/chat5.png)
- Mobile Adaptation

<div>
 <img src="./.doc/chat12.png" width = "190" style="display:inline-block;" alt="Mobile Adaptation" align=center />
 <img src="./.doc/chat13.png" width = "190" style="display:inline-block;" alt="Mobile Adaptation" align=center />
 <img src="./.doc/chat7.png" width = "190" style="display:inline-block;" alt="Mobile Adaptation" align=center />
 <img src="./.doc/rtc2.png" width = "190" style="display:inline-block;" alt="Mobile Adaptation" align=center />
 <img src="./.doc/rtc_remove_desktop.png" width = "190" style="display:inline-block;" alt="Mobile Adaptation" align=center />
 <img src="./.doc/chat8.png" width = "190" style="display:inline-block;" alt="Mobile Adaptation" align=center />
 <img src="./.doc/chat10.png" width = "190" style="display:inline-block;" alt="Mobile Adaptation" align=center />
 <img src="./.doc/chat11.png" width = "190" style="display:inline-block;" alt="Mobile Adaptation" align=center />
 <img src="./.doc/chat9.png" width = "190" style="display:inline-block;" alt="Mobile Adaptation" align=center />
</div>

## ⏳ Getting Started

### 📦 Install Dependencies

```sh
# Node version >= 18
npm install -g pnpm

pnpm install
```

### ✨ Development

- If there is a backend service, you can modify the `.env.development` environment variable file for development

```sh
# It is recommended to run separately
# Terminal 1: Start nuxt
pnpm run dev:nuxt
# Terminal 2: Start tauri
pnpm run dev:tauri
```

- If there is no backend service, modify the `.env.development` environment variable or use the `.env.production` configuration file.

```sh
# Terminal 1: Start prod nuxt (recommended ✔)
pnpm run prod:nuxt
# Terminal 2: Start tauri
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

## 🔧 Technology Stack | Tech Stack

| Category        | Technology/Component | Version   |
| --------------- | ------------------- | --------- |
| Framework      | Nuxt3              | ^3.14.159+ |
|                 | Tauri              | ^2.1.0    |
| UI Component Library | Element Plus      | ^2.8.4    |
| State Management | Pinia             | 2.1.7     |
| Utility Library | Vueuse            | 10.11.0   |
| Build & Development Tools | Nuxi          | lts      |
|                 | Vite              | lts      |
| Code Quality   | ESLint            | 8.56.0    |
|                 | Prettier          | 3.3.2    |
| Type Checking  | TypeScript        | 5.3.2    |
| Style Processing | Sass             | 1.77.6   |


## 🦾 Trends

![JiwuChat Star History Chart](https://api.star-history.com/svg?repos=KiWi233333/jiwu-mall-chat-tauri&type=Date)

## 💬 Contact

- Email: [kiwi2333@qq.com](mailto:kiwi2333@qq.com)
- QQ: [1329634286](https://wpa.qq.com/msgrd?v=3&uin=1329634286&site=qq&menu=yes)
