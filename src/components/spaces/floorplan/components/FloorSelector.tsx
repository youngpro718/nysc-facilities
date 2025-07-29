import React from 'react';
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
  if (!floors || floors.length === 0) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-sm">
        <Building2 className="h-4 w-4 text-slate-500" />
        <span className="text-sm text-slate-500">No floors available</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
        <Building2 className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        <div className="text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {currentFloor?.buildings.name || 'Building'}
          </span>
          <span className="text-slate-500 dark:text-slate-400 mx-1">•</span>
          <span className="text-slate-600 dark:text-slate-300">
            {currentFloor?.name || 'Select Floor'}
          </span>
        </div>
      </div>

      <Select value={selectedFloorId || undefined} onValueChange={onFloorSelect}>
        <SelectTrigger className="h-8 w-[180px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-sm">
          <SelectValue placeholder="Select floor..." />
        </SelectTrigger>
        <SelectContent>
          {floors.map((floor) => (
            <SelectItem key={floor.id} value={floor.id}>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{floor.buildings.name}</span>
                <span className="text-slate-500">•</span>
                <span>{floor.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
