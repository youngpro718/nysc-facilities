
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';

interface Floor {
  id: string;
  floor_number: number;
  name: string;
  buildings: { name: string };
}

interface FloorSelectorProps {
  floors: Floor[];
  selectedFloorId: string | null;
  onFloorSelect: (floorId: string) => void;
  currentFloor?: Floor;
}

export function FloorSelector({ 
  floors, 
  selectedFloorId, 
  onFloorSelect,
  currentFloor 
}: FloorSelectorProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  if (!floors || floors.length === 0) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
        <Building2 className="h-3.5 w-3.5" />
        <span>No floors available</span>
      </div>
    );
  }

  // Mobile: compact button that opens a dialog
  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="h-8 px-2.5 gap-1.5 text-xs"
        >
          <Building2 className="h-3.5 w-3.5" />
          <span className="max-w-[100px] truncate">
            {currentFloor ? `${currentFloor.buildings.name} — ${currentFloor.name}` : 'Select floor'}
          </span>
        </Button>

        <ResponsiveDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          title="Select Floor"
          description="Choose a floor to view its plan"
        >
          <div className="space-y-1.5">
            {floors.map((floor) => (
              <Button
                key={floor.id}
                variant={selectedFloorId === floor.id ? "secondary" : "ghost"}
                className="w-full justify-start h-auto py-2.5 text-sm"
                onClick={() => {
                  onFloorSelect(floor.id);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedFloorId === floor.id ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                  <span>{floor.buildings.name} — {floor.name}</span>
                </div>
              </Button>
            ))}
          </div>
        </ResponsiveDialog>
      </>
    );
  }

  // Desktop: simple compact Select dropdown
  return (
    <Select value={selectedFloorId || undefined} onValueChange={onFloorSelect}>
      <SelectTrigger className="h-8 w-[240px] text-xs bg-background border-border rounded-md">
        <div className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <SelectValue placeholder="Select floor..." />
        </div>
      </SelectTrigger>
      <SelectContent className="w-[260px]">
        {floors.map((floor) => (
          <SelectItem key={floor.id} value={floor.id} className="text-xs">
            {floor.buildings.name} — {floor.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
