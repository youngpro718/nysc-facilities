export function formatRequestId(
  id: string,
  displayId?: string | null,
): string {
  return displayId?.trim() || id.slice(0, 8).toUpperCase();
}

