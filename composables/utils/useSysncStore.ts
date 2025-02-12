/**
 * 跨页面同步数据
 */
export function useSyncSettingStore() {
  const listener = (e: StorageEvent) => {
    if (e.key === "nuxt-color-mode") {
      const val = e.newValue || "system" as any;
      const setting = useSettingStore();
      console.log(setting.isThemeChangeLoad);

      if (setting.isThemeChangeLoad) {
        return;
      }
      useColorMode().value = val;
      setting.settingPage.modeToggle.value = val;
    }
  };
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}
