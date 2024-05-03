
/**
 * 切换主题
 */
export function useModeToggle(mode: "dark" | "auto" | "light" | string, event?: MouseEvent) {
  const setting = useSettingStore();
  if (setting.isThemeChangeLoad)
    return;

  setting.isThemeChangeLoad = true;
  // 切换动画
  const colorMode = useColorMode();
  const isAppearanceTransition
    = document?.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (mode === "auto") {
    const hours = new Date().getHours();
    colorMode.preference = hours < 18 && hours > 6 ? "light" : "dark";
    return;
  }
  // 不支持
  if (!isAppearanceTransition) {
    colorMode.preference = mode;
    setting.isThemeChangeLoad = false;
    return;
  }
  if (!event && window) {
    // setting.isThemeChangeLoad = false;
    // colorMode.preference = mode;
    // 计算屏幕中心坐标
    const centerX = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) / 2;
    const centerY = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) / 2;
    event = {
      clientX: +centerX,
      clientY: +centerY,
    } as MouseEvent;
  }
  if (!event)
    return;
  // 画圆圈
  const x = event.clientX;
  const y = event.clientY;
  const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  // @ts-expect-error
  const transition = document.startViewTransition(() => {
    colorMode.preference = mode;
  });
  // 关闭所有渐变（优化性能）
  document.documentElement.classList.add("stop-transition");
  transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius.toFixed(0)}px at ${x}px ${y}px)`,
    ];
    document.documentElement.animate(
      {
        clipPath: colorMode.value === "dark" ? clipPath : [...clipPath].reverse(),
      },
      {
        duration: 560,
        easing: "ease-in-out",
        pseudoElement: colorMode.value === "dark" ? "::view-transition-new(root)" : "::view-transition-old(root)",
      },
    );
  }).catch(() => {

  });
  // 完成时
  transition.finished.then(() => {
    document.documentElement.classList.remove("stop-transition");
    setTimeout(() => {
      setting.isThemeChangeLoad = false;
    }, 50);
  }).catch(() => {
    setting.isThemeChangeLoad = false;
  });
}

