export function getNormalizedCurrentUse(room: {
  room_type: string;
  current_function?: string | null;
  is_storage?: boolean | null;
}): string | null {
  // Storage overrides everything
  if (room.is_storage) return "Storage";

  const current = (room.current_function || "").trim();
  const type = (room.room_type || "").trim();

  // If explicitly set and different from the base room type, prefer it
  if (current && current.toLowerCase() !== type.toLowerCase()) {
    return current;
  }

  // Courtrooms without an explicit current_function are considered active courtrooms
  if (type.toLowerCase() === "courtroom" && !current) {
    return "Active Courtroom";
  }

  // Otherwise no special current use label
  return null;
}
