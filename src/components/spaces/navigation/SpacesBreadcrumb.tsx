
import { Building2, ChevronRight, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface SpacesBreadcrumbProps {
  buildingId: string;
  floorId: string;
}

export function SpacesBreadcrumb({ buildingId, floorId }: SpacesBreadcrumbProps) {
  const { data: building } = useQuery({
    queryKey: ['building', buildingId],
    queryFn: async () => {
      if (!buildingId || buildingId === 'all') return null;
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('id', buildingId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!buildingId && buildingId !== 'all',
  });

  const { data: floor } = useQuery({
    queryKey: ['floor', floorId],
    queryFn: async () => {
      if (!floorId || floorId === 'all') return null;
      const { data, error } = await supabase
        .from('floors')
        .select('*')
        .eq('id', floorId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!floorId && floorId !== 'all',
  });

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      <Home className="h-4 w-4" />
      <ChevronRight className="h-4 w-4" />
      <span>Spaces</span>
      {building && (
        <>
          <ChevronRight className="h-4 w-4" />
          <div className="flex items-center">
            <Building2 className="mr-1 h-4 w-4" />
            <span>{building.name}</span>
          </div>
        </>
      )}
      {floor && (
        <>
          <ChevronRight className="h-4 w-4" />
          <span>{floor.name}</span>
        </>
      )}
    </nav>
  );
}
