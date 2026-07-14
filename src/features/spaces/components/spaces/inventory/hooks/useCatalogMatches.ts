import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface CatalogMatch {
  id: string;
  name: string;
  quantity: number;
  storage_room_id: string | null;
  room_name?: string;
  room_number?: string;
}

/**
 * Looks up existing catalog listings (primary items, not already linked
 * under another listing) with the same name, so an item being added in one
 * room can be recognized as the same product already stocked elsewhere.
 */
export function useCatalogMatches(name: string, excludeRoomId?: string) {
  const [debouncedName, setDebouncedName] = useState(name.trim());

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedName(name.trim()), 400);
    return () => clearTimeout(handle);
  }, [name]);

  return useQuery({
    queryKey: ["inventory-catalog-matches", debouncedName.toLowerCase(), excludeRoomId],
    enabled: debouncedName.length >= 2,
    queryFn: async () => {
      let query = supabase
        .from("inventory_items")
        .select("id, name, quantity, storage_room_id")
        .eq("status", "active")
        .is("catalog_item_id", null)
        .ilike("name", debouncedName)
        .order("name")
        .limit(5);

      if (excludeRoomId) {
        query = query.neq("storage_room_id", excludeRoomId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const items = data || [];
      const roomIds = Array.from(
        new Set(items.map((item) => item.storage_room_id).filter(Boolean))
      ) as string[];

      let rooms: { id: string; name: string; room_number: string }[] = [];
      if (roomIds.length > 0) {
        const { data: roomData, error: roomError } = await supabase
          .from("rooms")
          .select("id, name, room_number")
          .in("id", roomIds);
        if (roomError) throw roomError;
        rooms = roomData || [];
      }

      return items.map((item) => {
        const room = rooms.find((r) => r.id === item.storage_room_id);
        return {
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          storage_room_id: item.storage_room_id,
          room_name: room?.name,
          room_number: room?.room_number,
        } as CatalogMatch;
      });
    },
  });
}
