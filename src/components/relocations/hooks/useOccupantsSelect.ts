import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Option } from "@/components/ui/multi-select";

// Define the Occupant type based on what we need
interface Occupant {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  status: string;
}

export function useOccupantsSelect() {
  const { data: occupants, isLoading, isError } = useQuery<Occupant[]>({
    queryKey: ['occupants-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('occupant_details')
        .select('id, first_name, last_name, department, status')
        .eq('status', 'active')
        .order('last_name');
      if (error) throw error;
      return data || [];
    },
  });

  // Convert occupants to options format for MultiSelect
  const options: Option[] = occupants?.map(occupant => ({
    value: occupant.id,
    label: `${occupant.first_name} ${occupant.last_name} (${occupant.department})`,
  })) || [];

  return {
    options,
    isLoading,
    isError
  };
}
