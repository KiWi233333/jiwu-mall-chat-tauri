import { invoke } from "@tauri-apps/api/core";
import { download } from "@tauri-apps/plugin-upload";
import streamSaver from "streamsaver";

// export const IMG_MAX_SIZE = 3 * 1024 * 1024;// 3MB 图片大小
// export const VIDEO_MAX_SIZE = 20 * 1024 * 1024;// 20MB 视频文件大小
// export const FILE_MAX_SIZE = 50 * 1024 * 1024;// 50MB 文件大小

export const FILE_TYPE_ICON_MAP = {
  "text/plain": "/images/icon/TXT.png",

  "application/vnd.ms-excel": "/images/icon/XLS.png",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "/images/icon/XLSX.png",

  "application/vnd.ms-powerpoint": "/images/icon/PPT.png",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "/images/icon/PPTX.png",

  "application/msword": "/images/icon/DOC.png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "/images/icon/DOCX.png",

  "application/pdf": "/images/icon/PDF.png",
  "application/x-pdf": "/images/icon/PDF.png",
  "application/x-bzpdf": "/images/icon/PDF.png",
  "application/x-gzpdf": "/images/icon/PDF.png",
} as Record<string, string>;

export const FILE_UPLOAD_ACCEPT = Object.keys(FILE_TYPE_ICON_MAP).join(",");
/**
 * 默认文件图标
 */
export const FILE_TYPE_ICON_DEFAULT = "/images/icon/DEFAULT.png";


// 定制fs实现任意路径 https://github.com/lencx/tauri-tutorial/discussions/13
export const existsFile = (path: string) => invoke("exist_file", { path });
export const removeFile = (path: string) => invoke("remove_file", { path });
export const mkdirFile = (path: string) => invoke("mkdir_file", { path });
/**
 * 格式化文件大小
 * @param size 字节大小
 * @returns 格式化后的文件大小字符串
 * @example
 * formatFileSize(1024) // "1KB"
 * formatFileSize(1024 * 1024) // "1MB"
 * formatFileSize(1024 * 1024 * 1024) // "1GB"
 */
export function formatFileSize(size: number): string {
  if (size < 1024)
    return `${size} B`;
  else if (size < 1024 * 1024)
    return `${(size / 1024).toFixed(2)} KB`;
  else if (size < 1024 * 1024 * 1024)
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  else
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}


export interface FileItem {
  url: string
  fileName: string
  currentSize: number
  totalSize: number
  status: FileStatus
  localPath: string
  mimeType: string
  downloadTime: number
  fromUid?: string
}

export enum FileStatus {
  NOT_FOUND = 0,
  DOWNLOADING = 1,
  DOWNLOADED = 2,
  PAUSED = 3,
  ERROR = 4,
}

export const DownFileTextMap: Record<FileStatus, string> = {
  [FileStatus.DOWNLOADING]: "正在下载",
  [FileStatus.ERROR]: "下载失败",
  [FileStatus.PAUSED]: "暂停下载",
  [FileStatus.NOT_FOUND]: "文件不存在",
  [FileStatus.DOWNLOADED]: "下载完成",
};

// @unocss-include
export const DownFileStatusIconMap: Record<FileStatus, string> = {
  [FileStatus.DOWNLOADING]: "i-solar-download-minimalistic-broken",
  [FileStatus.ERROR]: "i-solar-danger-circle-outline",
  [FileStatus.PAUSED]: "i-solar-alt-arrow-right-bold",
  [FileStatus.NOT_FOUND]: "i-solar-file-corrupted-broken",
  [FileStatus.DOWNLOADED]: "i-solar-check-circle-outline",
};

/**
 * 下载文件(兼容web,pc端,移动端)
 * @param url 下载地址
 * @param fileName 下载后的文件名
 * @param options 下载选项
 * @param options.targetPath 下载到指定目录
 * @param options.mimeType 文件类型
 * @param callback 下载进度回调函数
 * @returns 下载进度对象
 */
export async function downloadFile(url: string, fileName: string, options: {
  targetPath?: string
  mimeType?: string
} = {}, callback?: (progress: number) => void) {
  const { targetPath = "", mimeType = "" } = options;
  const setting = useSettingStore();
  if (setting.isWeb || setting.isMobile) {
    // 移动端 | Web 使用 streamSaver 正在使用浏览器下载，请稍后 下载
    ElMessage.warning("正在下载，请稍后...");
    return downloadFileByStreamSaver(url, fileName, callback);
  }
  if (!setting.checkDownloadPath())
    return;
  let dir = setting.appDataDownloadDirUrl;
  const existsDir = await existsFile(dir);
  if (!existsDir) {
    // 选择下载目录
    const newDir = await setting.changeDownloadDir();
    if (!newDir) {
      return ElMessage.warning("请选择下载目录");
    }
    dir = newDir;
  }

  const finalFullPath = computedPath(targetPath || `${dir}\\${fileName}`);
  // 文件下载
  setting.fileDownloadMap[url] = {
    url,
    fileName,
    localPath: finalFullPath,
    currentSize: 0,
    totalSize: 0,
    status: FileStatus.DOWNLOADING,
    mimeType,
    downloadTime: Date.now(),
    fromUid: "",
  };
  let currentSize = 0;
  try {
    await download(
      url,
      finalFullPath,
      ({ progress, total }) => {
        currentSize += progress;
        setting.fileDownProgressCallback(url, currentSize, total);
      },
      { "Content-Type": "application/octet-stream" } as any,
    );
    // 下载完成后，通知设置存储
    if (typeof callback === "function")
      callback(1);
  }
  catch (error) {
    console.warn(error);
    ElNotification.warning({
      title: "下载失败",
      message: "文件下载失败，请稍后重试",
    });
    setting.fileDownloadMap[url]!.status = FileStatus.ERROR;
  }
}


/**
 * 计算路径
 * @param path 路径
 * @returns 新的路径
 */
export function computedPath(path: string) {
  const setting = useSettingStore();
  if (["andriod", "linux"].includes(setting.osType)) { // 安卓 linux
    return path.replace(/\\/g, "/");
  }
  return path;
}

/**
 * 下载文件 by streamSaver web端
 * https://segmentfault.com/a/1190000044342886
 * @param url 下载地址
 * @param fileName 下载后的文件名
 * @param callback 下载进度回调函数
 * @returns 下载进度对象
 */
export function downloadFileByStreamSaver(url: string, fileName: string, callback?: (progress: number) => void) {
  const progress = ref(0);
  // 若不支持
  if (!window?.WritableStream) {
    window.open(url);
    return {
      progress,
    };
  }
  let writer: WritableStreamDefaultWriter<Uint8Array>;
  // 【步骤1】创建一个文件，该文件支持写入操作
  const fileStream = streamSaver.createWriteStream(fileName); // 这里传入的是下载后的文件名，这个名字可以自定义
  // 【步骤2】使用 fetch 方法访问文件的url，将内容一点点的放到 StreamSaver 创建的文件里
  fetch(url)
    .then((res) => {
      const stream = res.body;
      if (!stream)
        return;

      if (window.WritableStream && stream.pipeTo) {
        return stream.pipeTo(fileStream)
          .then(() => {
            if (typeof callback === "function")
              callback(1);
            progress.value = 1;
          });
      }
      // 【步骤3】监听文件内容是否读取完整，读取完就执行“保存并关闭文件”的操作。
      writer = fileStream.getWriter();
      const reader = stream.getReader();
      const pump: () => void = () => reader.read()
        .then(res => res.done
          ? writer.close()
          : writer.write(res.value).then(pump),
        );
      // 【步骤4】监听写入进度
      pump();
    });

  return {
    progress,
  };
}


interface ThumbnailOptions {
  width?: number;
  height?: number;
  mimeType?: "image/png" | "image/jpg" | "image/webp" | "image/svg+xml";
  quality?: number;
}

/**
 * 生成视频缩略图
 * @param file 视频文件
 * @param options 缩略图选项
 * @returns 视频缩略图文件
 */
export function generateVideoThumbnail(file: File, options: ThumbnailOptions = {
  mimeType: "image/png",
  quality: 0.7,
}): Promise<VideoFileInfo> {
  return new Promise((resolve, reject) => {
    // 检查浏览器是否支持 OffscreenCanvas
    generateThumbnailWithCanvas(file, options, resolve, reject);
    // const supportsOffscreenCanvas = "OffscreenCanvas" in window;
    // if (supportsOffscreenCanvas) {
    //   // 使用 OffscreenCanvas 和 MediaSource 的现代方法
    //   generateThumbnailWithOffscreenCanvas(file, options, resolve, reject);
    // }
    // else {
    //   // 使用传统的 <video> 和 <canvas> 方法
    //   generateThumbnailWithCanvas(file, options, resolve, reject);
    // }
  });
}

function generateThumbnailWithOffscreenCanvas(
  file: File,
  options: ThumbnailOptions,
  resolve: (value: Blob) => void,
  reject: (reason: Error) => void,
): void {
  const mediaSource = new MediaSource();
  const videoUrl = URL.createObjectURL(mediaSource);
  const offscreenCanvas = new OffscreenCanvas(options.width || 320, options.height || 240); // 设置封面大小
  const ctx = offscreenCanvas.getContext("2d");

  mediaSource.addEventListener("sourceopen", async () => {
    const mimeType = await detectMimeType(file);
    if (!mimeType) {
      reject(new Error("Unsupported video format."));
      return;
    }

    const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target && e.target.result) {
        const arrayBuffer = e.target.result as ArrayBuffer;
        sourceBuffer.appendBuffer(arrayBuffer);

        sourceBuffer.addEventListener("updateend", () => {
          const video = document.createElement("video");
          video.src = videoUrl;
          video.addEventListener("loadeddata", () => {
            video.currentTime = video.duration / 2;
          });

          video.addEventListener("seeked", () => {
            if (ctx) {
              ctx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
              offscreenCanvas.convertToBlob().then((blob) => {
                resolve(blob);
                URL.revokeObjectURL(videoUrl);
                mediaSource.endOfStream();
              });
            }
          });

          video.addEventListener("error", (e) => {
            reject(new Error("Error occurred while playing the video."));
          });
        });
      }
    };

    reader.readAsArrayBuffer(file);

    reader.onerror = (e) => {
      reject(new Error("Error occurred while reading the file."));
    };
  });

  mediaSource.addEventListener("error", (e) => {
    reject(new Error("Error occurred while generating thumbnail using OffscreenCanvas."));
  });
}

function detectMimeType(file: File): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && e.target.result) {
        const arrayBuffer = e.target.result as ArrayBuffer;
        const dataView = new DataView(arrayBuffer);

        // 检测文件头
        if (dataView.getUint32(0) === 0x66747970) { // 'ftyp'
          // MP4 文件
          resolve("video/mp4; codecs=\"avc1.42E01E, mp4a.40.2\"");
        }
        else if (dataView.getUint32(0) === 0x1A45DFA3) { // EBML header
          // WebM 文件
          resolve("video/webm; codecs=\"vp8, vorbis\"");
        }
        else if (dataView.getUint8(0) === 0x4F && dataView.getUint8(1) === 0x67) { // 'Og'
          // OGG 文件
          resolve("video/ogg; codecs=\"theora, vorbis\"");
        }
        else {
          resolve(null); // 未知格式
        }
      }
    };
    reader.readAsArrayBuffer(file.slice(0, 10)); // 读取文件头
  });
}


/**
 * 生成视频缩略图
 * @param file 视频文件
 * @param options 缩略图选项
 * @param resolve 成功回调
 * @param reject 失败回调
 */
function generateThumbnailWithCanvas(
  file: File,
  options: ThumbnailOptions,
  resolve: (fileInfo: VideoFileInfo) => void,
  reject: (reason: Error) => void,
): void {
  const video = document.createElement("video");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target && e.target.result) {
      video.src = e.target.result as string;

      // 视频时长
      video.addEventListener("loadeddata", () => {
        video.currentTime = video.duration / 2;
      });

      // 视频尺寸
      video.addEventListener("seeked", () => {
        canvas.width = options.width || video.videoWidth;
        canvas.height = options.height || video.videoHeight;
        if (!ctx) {
          reject(new Error("Error occurred while generating thumbnail using Canvas."));
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({
              blob,
              duration: video.duration,
              width: video.videoWidth,
              height: video.videoHeight,
              size: file.size,
            });
          }
          else {
            reject(new Error("Error occurred while generating thumbnail using Canvas."));
          }
        }, options.mimeType || "image/png", options.quality || 1);
      });
    }
  };
  reader.readAsDataURL(file);

  video.addEventListener("error", (e) => {
    reject(new Error("Error occurred while generating thumbnail using Canvas."));
  });
}

export interface VideoFileInfo {
  blob: Blob;
  duration: number;
  width: number;
  height: number;
  size: number;
}
