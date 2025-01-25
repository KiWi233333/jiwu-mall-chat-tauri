// export function useSyncStore(key: string, storeContext: ) {

// }

/**
 * 跨页面同步数据
 */
export function useSyncSettingStore() {
  const listener = (e: StorageEvent) => {
    if (e.key === "nuxt-color-mode")
      useColorMode().value = e.newValue || "system" as any;
  };
  // window.addEventListener("storage", (e) => {
  //   if (e.key === SETTING_STORE_KEY)
  //     useSettingStore().$dispose();
  // });
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}
