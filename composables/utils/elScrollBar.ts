
/**
 * 滚动到指定位置
 */
export function scrollElBar(scrollbarRef: any, QsDom: string, offset: number) {
  offset = offset || -10;
  const el = document.querySelector(QsDom) as HTMLElement;
  if (!el)
    return;
  nextTick(() => {
    scrollbarRef!.setScrollTop((el?.offsetTop || 0) + offset);
  });
}
