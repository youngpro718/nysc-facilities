/**
 * Small helper around the browser Notification API. Kept dependency-free so
 * it can be pulled into any hook without dragging in React.
 */

const supported = typeof window !== "undefined" && "Notification" in window;

export function isDesktopNotificationSupported(): boolean {
  return supported;
}

export function getDesktopNotificationPermission(): NotificationPermission | "unsupported" {
  if (!supported) return "unsupported";
  return Notification.permission;
}

/**
 * Requests permission if it hasn't been granted or denied yet. Returns the
 * final permission value. Safe to call from a user gesture handler.
 */
export async function requestDesktopNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (!supported) return "unsupported";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/**
 * Shows a native desktop notification. Silently no-ops when the browser
 * doesn't support notifications or the user hasn't granted permission.
 * Clicking the notification focuses this tab and navigates to `actionUrl`
 * when provided.
 */
export function showDesktopNotification(
  title: string,
  options: { body?: string; actionUrl?: string; tag?: string } = {},
): void {
  if (!supported || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body: options.body,
      tag: options.tag,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
    });
    n.onclick = () => {
      window.focus();
      if (options.actionUrl && options.actionUrl.startsWith("/")) {
        window.location.href = options.actionUrl;
      }
      n.close();
    };
  } catch {
    /* ignore — notification API can throw in odd contexts */
  }
}
