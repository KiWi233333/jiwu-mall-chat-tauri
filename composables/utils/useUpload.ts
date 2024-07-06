import * as qiniu from "qiniu-js";
import { OssFileType } from "../api/res";

export async function useOssUpload(fileType: OssFileType, ossFile: OssFile, token: string, options: {
  uploadQuality?: number
  callback?: (event: "success" | "error", data: string, file: OssFile) => void
} = {
  uploadQuality: 0.6,
  callback: () => { },
}) {
  const { uploadQuality = 0.6, callback = () => {} } = options;
  const file = shallowReactive(ossFile);
  // 1）获取凭证
  const data = await getResToken(fileType, token);
  if (data.code !== StatusCode.SUCCESS) {
    file.status = "warning";
    return;
  }
  else {
    file.key = data.data.key;
  }
  if (!file?.file) {
    callback("error", "请选择文件！", file);
    return;
  };
  // ------------添加到队列-----------
  // 上传中 只能压缩图片
  if (fileType === OssFileType.IMAGE) {
    let error = "";
    const ops = {
      quality: uploadQuality,
      noCompressIfLarger: true,
    };
    try {
      const res = await qiniu.compressImage(file?.file, ops).then((res) => {
      // 2）上传 监视器
        qiniuUploadListener(res.dist as File, file?.key || "", data.data.uploadToken, file, callback);
      });
    }
    catch (e) {
      console.warn(e);
      file.status = "warning";
      error = "图片压缩失败，请稍后再试！";
      callback("error", error, file);
    }
  }
  else {
    return qiniuUploadListener(file.file, file?.key || "", data.data.uploadToken, file, callback);
  }
}

// 封装上传处理
export function qiniuUploadListener(dist: File, key: string, token: string, file: OssFile, callback: (event: "success" | "error", msg: string, file: OssFile) => void) {
  const observable = uploadOssFileSe(dist, key, token);
  const subscribe = observable.subscribe({
    next(res) {
      file.percent = +res.total.percent.toFixed(2);
    },
    error(e) {
      file.status = "warning";
      const err = e as any;
      if (err?.code) {
        const msg = getOssErrorCode(err?.code) || "上传失败，请稍后再试！";
        callback("error", msg, file);
      }
      else {
        file.status = "success";
        ElMessage.error("上传失败，稍后再试！");
      }
    },
    complete() {
      file.status = "success";
      file.percent = 100;
      if (file.key)
        callback("success", file.key, file);
    },
  });
  file.subscribe = subscribe;
  return subscribe;
}
