// Universal UUID validation utility
export function filterValidUUIDs(ids: string[]): string[] {
  return ids.filter(id => /^[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}$/.test(id));
}
