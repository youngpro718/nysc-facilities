import React from 'react';
import { RoomTools } from './RoomTools';
import { HallwayTools } from './HallwayTools';
import { LayoutTools } from './LayoutTools';
import { Separator } from '@/components/ui/separator';

interface FloorPlanToolbarProps {
  floorId: string;
  gridEnabled: boolean;
  snapToGridEnabled: boolean;
  autoLayoutEnabled: boolean;
  onRoomCreate?: () => void;
  onRoomEdit?: (roomId: string) => void;
  onRoomDelete?: (roomId: string) => void;
  onRoomConnect?: (roomId: string) => void;
  onHallwayCreate?: () => void;
  onHallwayRoute?: (hallwayId: string) => void;
  onHallwayConnect?: (hallwayId: string) => void;
  onHallwayDelete?: (hallwayId: string) => void;
  onToggleGrid: () => void;
  onToggleSnapToGrid: () => void;
  onToggleAutoLayout: () => void;
}

export function FloorPlanToolbar({
  floorId,
  gridEnabled,
  snapToGridEnabled,
  autoLayoutEnabled,
  onRoomCreate,
  onRoomEdit,
  onRoomDelete,
  onRoomConnect,
  onHallwayCreate,
  onHallwayRoute,
  onHallwayConnect,
  onHallwayDelete,
  onToggleGrid,
  onToggleSnapToGrid,
  onToggleAutoLayout
}: FloorPlanToolbarProps) {
  return (
    <div className="flex items-center gap-4 p-2 border-b">
      <RoomTools
        floorId={floorId}
        onRoomCreate={onRoomCreate}
        onRoomEdit={onRoomEdit}
        onRoomDelete={onRoomDelete}
        onRoomConnect={onRoomConnect}
      />
      <Separator orientation="vertical" className="h-8" />
      <HallwayTools
        floorId={floorId}
        onHallwayCreate={onHallwayCreate}
        onHallwayRoute={onHallwayRoute}
        onHallwayConnect={onHallwayConnect}
        onHallwayDelete={onHallwayDelete}
      />
      <Separator orientation="vertical" className="h-8" />
      <LayoutTools
        gridEnabled={gridEnabled}
        snapToGridEnabled={snapToGridEnabled}
        autoLayoutEnabled={autoLayoutEnabled}
        onToggleGrid={onToggleGrid}
        onToggleSnapToGrid={onToggleSnapToGrid}
        onToggleAutoLayout={onToggleAutoLayout}
      />
    </div>
  );
}
