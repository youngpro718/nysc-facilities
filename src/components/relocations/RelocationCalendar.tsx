
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface RelocationDay {
  date: Date;
  relocations: {
    id: string;
    originalRoom: string;
    temporaryRoom: string;
    type: string;
  }[];
}

export function RelocationCalendar() {
  const { data: relocations, isLoading } = useQuery({
    queryKey: ['relocations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('active_relocations_view')
        .select('*')
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Transform relocations into a format suitable for the calendar
  const relocationDays = relocations?.reduce<Record<string, RelocationDay>>((acc, relocation) => {
    const startDate = new Date(relocation.start_date).toISOString().split('T')[0];
    const endDate = new Date(relocation.end_date).toISOString().split('T')[0];
    
    if (!acc[startDate]) {
      acc[startDate] = {
        date: new Date(startDate),
        relocations: []
      };
    }

    acc[startDate].relocations.push({
      id: relocation.id,
      originalRoom: `${relocation.original_room_number}`,
      temporaryRoom: `${relocation.temporary_room_number}`,
      type: relocation.relocation_type
    });

    return acc;
  }, {});

  const modifiers = {
    hasRelocations: Object.values(relocationDays || {}).map(day => day.date)
  };

  const modifiersStyles = {
    hasRelocations: {
      backgroundColor: 'rgb(59 130 246)',
      color: 'white',
      borderRadius: '50%'
    }
  };

  return (
    <Card className="p-4">
      <div className="grid gap-4 sm:grid-cols-[350px,1fr]">
        <Calendar
          mode="single"
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          selected={undefined}
          className="rounded-md border"
        />
        <div className="space-y-4">
          <h3 className="font-medium">Scheduled Relocations</h3>
          <div className="space-y-2">
            {Object.values(relocationDays || {}).map((day) => (
              <div key={day.date.toISOString()} className="space-y-2">
                <p className="text-sm font-medium">
                  {day.date.toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                {day.relocations.map((relocation) => (
                  <div 
                    key={relocation.id} 
                    className="rounded-lg border p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Room {relocation.originalRoom} → {relocation.temporaryRoom}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {relocation.type} Relocation
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
