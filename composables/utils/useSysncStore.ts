// export function useSyncStore(key: string, storeContext: ) {

// }

/**
 * 跨页面同步数据
 */
export function useSyncSettingStore() {
  const listener = (e: StorageEvent) => {
    if (e.key === "nuxt-color-mode") {
      const val = e.newValue || "system" as any;
      useColorMode().value = val;
      useModeToggle(val, undefined, false);
    }
  };
  // window.addEventListener("storage", (e) => {
  //   if (e.key === SETTING_STORE_KEY)
  //     useSettingStore().$dispose();
  // });
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}
