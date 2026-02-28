
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600">
        <div className="p-2 bg-slate-200 dark:bg-slate-600 rounded-lg">
          <Building2 className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        </div>
        <div>
          <div className="text-sm font-medium text-slate-700 dark:text-slate-200">No Floors Available</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Please add floors to view floor plans</div>
        </div>
      </div>
    );
  }

  // Mobile compact version
  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="h-9 px-3 gap-2"
        >
          <Building2 className="h-4 w-4" />
          <span className="text-xs font-medium">
            {currentFloor?.floor_number || '?'}
          </span>
        </Button>

        <ResponsiveDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          title="Select Floor"
          description="Choose a floor to view its plan"
        >
          <div className="space-y-2">
            {floors.map((floor) => (
              <Button
                key={floor.id}
                variant={selectedFloorId === floor.id ? "secondary" : "outline"}
                className="w-full justify-start h-auto py-3"
                onClick={() => {
                  onFloorSelect(floor.id);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="text-left">
                    <div className="font-medium">{floor.buildings.name}</div>
                    <div className="text-xs text-muted-foreground">{floor.name}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </ResponsiveDialog>
      </>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Current Floor Display */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 dark:border-blue-700/50">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 dark:bg-blue-800/50 rounded-lg">
          <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 truncate">
            {currentFloor?.buildings.name || 'Building Name'}
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-400 dark:text-blue-300 flex items-center gap-1">
            <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
            {currentFloor?.name || 'Select Floor'}
          </div>
        </div>
      </div>

      {/* Floor Selector */}
      <Select value={selectedFloorId || undefined} onValueChange={onFloorSelect}>
        <SelectTrigger className="h-12 w-[220px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <div className="flex items-center gap-2">
            <ChevronDown className="h-4 w-4 text-slate-500" />
            <SelectValue placeholder="Choose different floor..." />
          </div>
        </SelectTrigger>
        <SelectContent className="w-[220px] rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
          {floors.map((floor) => (
            <SelectItem 
              key={floor.id} 
              value={floor.id}
              className="rounded-lg mx-1 my-0.5 focus:bg-blue-50 dark:bg-blue-950/30 dark:focus:bg-blue-900/20"
            >
              <div className="flex items-center gap-3 py-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {floor.buildings.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {floor.name}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
