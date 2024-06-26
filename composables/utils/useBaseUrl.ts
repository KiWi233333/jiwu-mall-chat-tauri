// const isDev = !import.meta.env.DEV;
const isDev = true;


// http请求
const BASE_URL = isDev ? "http://localhost:9090/" : "https://api.jiwu.kiwi2333.top/";
export const BaseUrl = BASE_URL;
// 图片
export const BASE_OSS_PATH = "https://quang.kiwi2333.top/";
export const BaseUrlImg = BASE_OSS_PATH;
export const BaseUrlVideo = BASE_OSS_PATH;
export const BaseUrlFile = BASE_OSS_PATH;
export const AuthKey = "Authorization";

// websocket
export const BaseWSUrl = isDev
  ? "ws://localhost:9091/"
  : "wss://api.jiwu.kiwi2333.top/websocket";
