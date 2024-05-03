// const isDev = !import.meta.env.DEV;
const isDev = false;


// http请求
const BASE_URL = isDev ? "http://localhost:9090/" : "https://api.jiwu.kiwi2333.top/";
export const BaseUrl = BASE_URL;
// 图片
export const BaseUrlImg = `${BaseUrl}res/`;
export const BaseUrlVideo = `${BaseUrl}res/`;
export const BaseUrlFile = `${BaseUrl}res/`;
export const AuthKey = "Authorization";

// websocket
export const BaseWSUrl = isDev
  ? "ws://localhost:9091/"
  : "wss://api.jiwu.kiwi2333.top/websocket";
