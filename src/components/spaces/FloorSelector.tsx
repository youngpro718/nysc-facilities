
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FloorSelectorProps {
  buildingId?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FloorSelector({ buildingId, value, onChange, className }: FloorSelectorProps) {
  const { data: floors, isLoading } = useQuery({
    queryKey: ["floors", buildingId],
    queryFn: async () => {
      let query = supabase.from("floors").select("id, name, floor_number");
      
      if (buildingId && buildingId !== "all") {
        query = query.eq('building_id', buildingId);
      }
      
      const { data, error } = await query
        .eq('status', 'active')
        .order('floor_number');
      
      if (error) throw error;
      return data || [];
    },
    enabled: true
  });
  
  const getPlaceholder = () => {
    if (isLoading) return "Loading floors...";
    if (buildingId === "all" || !buildingId) return "All Floors";
    if (floors?.length === 0) return "No floors found";
    return "Select Floor";
  };

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={buildingId === "all" ? true : false}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={getPlaceholder()} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Floors</SelectItem>
        {floors?.map((floor) => (
          <SelectItem key={floor.id} value={floor.id}>
            {floor.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
