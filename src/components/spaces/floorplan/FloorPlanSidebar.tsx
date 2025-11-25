/**
 * FloorPlanSidebar - Object list and details panel
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  X,
  Square,
  CornerDownRight,
  DoorOpen,
  MapPin,
  Ruler,
  Tag,
  Building2,
  Users,
  Info,
} from 'lucide-react';

interface FloorPlanSidebarProps {
  objects: any[];
  filteredObjects: any[];
  selectedObject: any | null;
  selectedObjectId: string | null;
  onObjectSelect: (id: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterType: 'all' | 'room' | 'hallway' | 'door';
  onFilterChange: (type: 'all' | 'room' | 'hallway' | 'door') => void;
  currentFloor?: any;
}

const typeIcons = {
  room: Square,
  hallway: CornerDownRight,
  door: DoorOpen,
};

const typeColors = {
  room: 'bg-blue-100 text-blue-700 border-blue-200',
  hallway: 'bg-slate-100 text-slate-700 border-slate-200',
  door: 'bg-amber-100 text-amber-700 border-amber-200',
};

// Room type specific colors for badges
const roomTypeColors: Record<string, string> = {
  courtroom: 'bg-amber-800 text-amber-50',
  office: 'bg-blue-500 text-blue-50',
  conference: 'bg-indigo-500 text-indigo-50',
  conference_room: 'bg-indigo-500 text-indigo-50',
  storage: 'bg-stone-500 text-stone-50',
  filing_room: 'bg-orange-500 text-orange-50',
  restroom: 'bg-cyan-500 text-cyan-50',
  utility: 'bg-zinc-500 text-zinc-50',
  jury_room: 'bg-violet-600 text-violet-50',
  chamber: 'bg-teal-600 text-teal-50',
  default: 'bg-slate-500 text-slate-50',
};

function getRoomTypeBadgeColor(roomType: string | undefined): string {
  if (!roomType) return roomTypeColors.default;
  const normalized = roomType.toLowerCase().replace(/\s+/g, '_');
  return roomTypeColors[normalized] || roomTypeColors.default;
}

export function FloorPlanSidebar({
  objects,
  filteredObjects,
  selectedObject,
  selectedObjectId,
  onObjectSelect,
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  currentFloor,
}: FloorPlanSidebarProps) {
  // Group objects by type for counts
  const counts = useMemo(() => ({
    all: objects.length,
    room: objects.filter(o => o.type === 'room').length,
    hallway: objects.filter(o => o.type === 'hallway').length,
    door: objects.filter(o => o.type === 'door').length,
  }), [objects]);

  return (
    <div className="w-80 border-l bg-card flex flex-col">
      {/* Search & Filter */}
      <div className="p-4 space-y-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search objects..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-8 h-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => onSearchChange('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1">
          {(['all', 'room', 'hallway', 'door'] as const).map((type) => (
            <Button
              key={type}
              variant={filterType === type ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => onFilterChange(type)}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
              <Badge variant="outline" className="ml-1.5 h-4 px-1 text-[10px]">
                {counts[type]}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Object List or Details */}
      <ScrollArea className="flex-1">
        {selectedObject ? (
          // Object Details
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Object Details</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onObjectSelect(null)}
              >
                <X className="h-3 w-3 mr-1" />
                Close
              </Button>
            </div>

            {/* Type Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn('capitalize', typeColors[selectedObject.type as keyof typeof typeColors])}>
                {selectedObject.type}
              </Badge>
              {selectedObject.data?.properties?.room_type && (
                <Badge className={cn('capitalize text-xs', getRoomTypeBadgeColor(selectedObject.data.properties.room_type))}>
                  {selectedObject.data.properties.room_type.replace(/_/g, ' ')}
                </Badge>
              )}
              {selectedObject.data?.properties?.status && (
                <Badge variant={selectedObject.data.properties.status === 'active' ? 'default' : 'secondary'}>
                  {selectedObject.data.properties.status}
                </Badge>
              )}
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" /> Name
              </label>
              <p className="font-medium">
                {selectedObject.data?.label || selectedObject.name || 'Unnamed'}
              </p>
            </div>

            {/* Room Number */}
            {selectedObject.data?.properties?.room_number && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Room Number
                </label>
                <p className="font-medium">#{selectedObject.data.properties.room_number}</p>
              </div>
            )}

            <Separator />

            {/* Position */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Position
              </label>
              <p className="text-sm font-mono">
                X: {Math.round(selectedObject.position?.x || 0)}, Y: {Math.round(selectedObject.position?.y || 0)}
              </p>
            </div>

            {/* Size */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Ruler className="h-3 w-3" /> Size
              </label>
              <p className="text-sm font-mono">
                {Math.round(selectedObject.data?.size?.width || 100)} × {Math.round(selectedObject.data?.size?.height || 100)}
              </p>
            </div>

            {/* Room Type */}
            {selectedObject.data?.properties?.room_type && (
              <>
                <Separator />
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" /> Room Type
                  </label>
                  <p className="text-sm capitalize">
                    {selectedObject.data.properties.room_type.replace(/_/g, ' ')}
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          // Object List
          <div className="p-2">
            {filteredObjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No objects found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredObjects.map((obj) => {
                  const Icon = typeIcons[obj.type as keyof typeof typeIcons] || Square;
                  const isSelected = obj.id === selectedObjectId;
                  
                  return (
                    <button
                      key={obj.id}
                      onClick={() => onObjectSelect(obj.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors',
                        isSelected
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50'
                      )}
                    >
                      <div className={cn(
                        'p-1.5 rounded',
                        obj.type === 'room' && 'bg-blue-100 text-blue-600',
                        obj.type === 'hallway' && 'bg-slate-100 text-slate-600',
                        obj.type === 'door' && 'bg-amber-100 text-amber-600',
                      )}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {obj.data?.label || obj.name || 'Unnamed'}
                        </p>
                        <div className="flex items-center gap-1.5">
                          {obj.data?.properties?.room_number && (
                            <span className="text-xs text-muted-foreground">
                              #{obj.data.properties.room_number}
                            </span>
                          )}
                          {obj.data?.properties?.room_type && (
                            <span className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded capitalize',
                              getRoomTypeBadgeColor(obj.data.properties.room_type)
                            )}>
                              {obj.data.properties.room_type.replace(/_/g, ' ')}
                            </span>
                          )}
                          {!obj.data?.properties?.room_number && !obj.data?.properties?.room_type && (
                            <span className="text-xs text-muted-foreground capitalize">
                              {obj.type}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          {currentFloor?.name || 'Floor'} • {filteredObjects.length} of {objects.length} objects
        </p>
      </div>
    </div>
  );
}

export default FloorPlanSidebar;
