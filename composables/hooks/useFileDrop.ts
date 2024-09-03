import { appWindow } from "@tauri-apps/api/window";

/**
 * 监听全局文件拖拽
 */
export async function useLinterFileDrop() {
  const fileList = ref<File[]>([]);
  const unlisten = await appWindow.onFileDropEvent((event) => {
    if (event.payload.type === "hover")
      console.log("User hovering", event.payload.paths);
    else if (event.payload.type === "drop")
      console.log("User dropped", event.payload.paths);
    else
      console.log("File drop cancelled");
  });

  // 取消监听
  onUnmounted(() => {
    unlisten();
  });

  return {
    fileList,
  };
}
