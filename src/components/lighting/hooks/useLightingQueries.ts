
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const useLightingQueries = () => {
  const { data: floors } = useQuery({
    queryKey: ['floors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('floors')
        .select('id, name, buildings(name)')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: zones } = useQuery({
    queryKey: ['lighting_zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_zones')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  return { floors, zones };
};
