
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2, CalendarDays, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Relocation {
  id: string;
  original_room_name: string;
  temporary_room_name: string;
  original_room_number: string;
  temporary_room_number: string;
  building_name: string;
  floor_name: string;
  start_date: string;
  end_date: string;
  status: string;
  reason: string;
}

export function RelocationsList() {
  const { data: relocations, isLoading } = useQuery({
    queryKey: ['relocations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('active_relocations_view')
        .select('*')
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      return data as Relocation[];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!relocations || relocations.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          No active relocations found
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {relocations.map((relocation) => (
        <Card key={relocation.id} className="p-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">
                  Room {relocation.original_room_number}
                </h3>
                <ArrowRight className="h-4 w-4" />
                <h3 className="text-lg font-semibold">
                  Room {relocation.temporary_room_number}
                </h3>
                <Badge variant={relocation.status === 'active' ? 'default' : 'secondary'}>
                  {relocation.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {relocation.building_name} - Floor {relocation.floor_name}
              </p>
              <p className="text-sm">{relocation.reason}</p>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <div>
                <p>Start: {format(new Date(relocation.start_date), 'MMM d, yyyy')}</p>
                <p>End: {format(new Date(relocation.end_date), 'MMM d, yyyy')}</p>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
