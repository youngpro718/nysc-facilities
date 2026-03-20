import React from 'react';
import { Badge } from '@/components/ui/badge';
import RoomsPage from './views/RoomsPage';
import { useRoomsQuery } from './hooks/queries/useRoomsQuery';

const SpacesTabs = () => {
  const { data: rooms } = useRoomsQuery({});
  const totalRooms = rooms?.length ?? 0;
  const activeRooms = rooms?.filter(r => r.status === 'active').length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header with room counts */}
      <div className="border-b sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-1 pt-4 pb-2">
          <h2 className="text-lg font-semibold">Rooms</h2>
          <div className="hidden sm:flex items-center gap-2">
            {totalRooms > 0 && (
              <>
                <Badge variant="outline" className="text-xs">{totalRooms} Total</Badge>
                <Badge variant="secondary" className="text-xs">{activeRooms} Active</Badge>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-w-0">
        <div className="min-h-[500px]">
          <RoomsPage />
        </div>
      </div>
    </div>
  );
};

export default SpacesTabs;
