/**
 * Taskbar/dock icon badge count for the installed PWA, via the Badging API.
 * Chromium-only (Chrome, Edge) — Firefox and Safari don't implement it, so
 * every call is feature-detected and silently no-ops where unsupported.
 */
export function setAppBadgeCount(count: number) {
  if (!('setAppBadge' in navigator)) return;
  try {
    if (count > 0) {
      navigator.setAppBadge(count).catch(() => {});
    } else if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(() => {});
    }
  } catch {
    // Badging API unsupported or blocked — nothing to do.
  }
}
