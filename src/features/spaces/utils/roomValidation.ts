import { supabase } from "@/lib/supabase";

/**
 * Check if setting a parent room would create a circular dependency
 * @param roomId - The room being edited
 * @param proposedParentId - The proposed parent room ID
 * @returns true if circular dependency detected, false otherwise
 */
export async function wouldCreateCircularDependency(
  roomId: string | undefined,
  proposedParentId: string | null
): Promise<boolean> {
  if (!roomId || !proposedParentId || roomId === proposedParentId) {
    return false;
  }

  // Traverse up the parent chain to detect cycles
  let currentParentId: string | null = proposedParentId;
  const visited = new Set<string>([roomId]);
  let depth = 0;
  const MAX_DEPTH = 10; // Safety limit to prevent infinite loops

  while (currentParentId && depth < MAX_DEPTH) {
    // If we encounter the original room, we have a cycle
    if (visited.has(currentParentId)) {
      return true;
    }

    visited.add(currentParentId);

    // Fetch the parent's parent
    const { data, error } = await supabase
      .from('rooms')
      .select('parent_room_id')
      .eq('id', currentParentId)
      .single();

    if (error || !data) {
      break;
    }

    currentParentId = data.parent_room_id;
    depth++;
  }

  return false;
}

/**
 * Get the full parent chain for a room
 * @param roomId - The room ID to get parents for
 * @returns Array of parent room IDs from immediate parent to root
 */
export async function getParentChain(roomId: string): Promise<string[]> {
  const chain: string[] = [];
  let currentId: string | null = roomId;
  let depth = 0;
  const MAX_DEPTH = 10;

  while (currentId && depth < MAX_DEPTH) {
    const { data, error } = await supabase
      .from('rooms')
      .select('parent_room_id')
      .eq('id', currentId)
      .single();

    if (error || !data || !data.parent_room_id) {
      break;
    }

    chain.push(data.parent_room_id);
    currentId = data.parent_room_id;
    depth++;
  }

  return chain;
}
