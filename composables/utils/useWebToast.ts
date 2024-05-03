export function useWebToast(title: string, body?: string, opts?: any) {
  const windToast = useWebNotification({
    title,
    body,
    icon: "/logo.png",
    ...opts,
  });
  if (windToast.isSupported)
    windToast.show();
}
