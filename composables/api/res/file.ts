
export const FILE_MAX_SIZE = 100 * 1024 * 1024;// 100MB
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
/**
 * 默认文件图标
 */
export const FILE_TYPE_ICON_DEFAULT = "/images/icon/DEFAULT.png";


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
