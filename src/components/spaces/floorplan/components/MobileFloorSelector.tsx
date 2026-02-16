// @ts-nocheck
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MobileFloorSelectorProps {
  selectedFloorId: string | null;
  onFloorSelect: (floorId: string) => void;
}

interface Floor {
  id: string;
  floor_number: number;
  name: string | null;
  buildings: {
    name: string;
  } | null;
}

export function MobileFloorSelector({ selectedFloorId, onFloorSelect }: MobileFloorSelectorProps) {
  const [open, setOpen] = useState(false);

  const { data: floors = [], isLoading } = useQuery({
    queryKey: ['floors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('floors')
        .select('*, buildings!floors_building_id_fkey(name)')
        .order('floor_number', { ascending: false });

      if (error) throw error;
      return (data || []) as Floor[];
    },
  });

  const selectedFloor = floors.find(f => f.id === selectedFloorId);

  const handleSelect = (floorId: string) => {
    onFloorSelect(floorId);
    setOpen(false);
  };

  const groupedFloors = floors.reduce((acc, floor) => {
    const buildingName = floor.buildings?.name || 'Unassigned';
    if (!acc[buildingName]) {
      acc[buildingName] = [];
    }
    acc[buildingName].push(floor);
    return acc;
  }, {} as Record<string, Floor[]>);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="touch-target gap-2"
      >
        <span className="font-medium">
          {selectedFloor ? `Floor ${selectedFloor.floor_number}` : 'Select Floor'}
        </span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Select Floor"
        description="Choose a floor to view"
      >
        <ScrollArea className="h-full max-h-[60vh]">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading floors...</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedFloors).map(([buildingName, buildingFloors]) => (
                <div key={buildingName}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
                    {buildingName}
                  </h3>
                  <div className="space-y-1">
                    {buildingFloors.map((floor) => (
                      <Button
                        key={floor.id}
                        variant={floor.id === selectedFloorId ? 'default' : 'ghost'}
                        className="w-full justify-start touch-target"
                        onClick={() => handleSelect(floor.id)}
                      >
                        <span className="font-medium">Floor {floor.floor_number}</span>
                        {floor.name && (
                          <span className="ml-2 text-muted-foreground">- {floor.name}</span>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </ResponsiveDialog>
    </>
  );
}
