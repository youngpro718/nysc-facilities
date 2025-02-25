
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Room {
  id: string;
  name: string;
  room_number: string;
  floors: {
    id: string;
    name: string;
    buildings: {
      id: string;
      name: string;
    }
  }
}

export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id,
          name,
          room_number,
          floors (
            id,
            name,
            buildings (
              id,
              name
            )
          )
        `)
        .eq('status', 'active')
        .order('room_number');

      if (error) throw error;
      return data as Room[];
    }
  });
}
