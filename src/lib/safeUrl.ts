/**
 * Returns the URL only if it uses a safe scheme (http, https, or relative).
 * Prevents javascript:, data:, vbscript:, etc. from being rendered as
 * <img src> or <a href> — mitigates stored XSS via user-supplied URLs.
 */
export function safePhotoUrl(url: string | null | undefined): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  // Allow relative paths and protocol-relative URLs
  if (trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("../")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function safePhotoUrls(urls: (string | null | undefined)[] | null | undefined): string[] {
  if (!urls || !Array.isArray(urls)) return [];
  return urls.map(safePhotoUrl).filter((u): u is string => Boolean(u));
}
