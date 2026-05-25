import React from 'react';
import { Badge } from '@/components/ui/badge';
import RoomsPage from './views/RoomsPage';
import { useRoomsQuery } from './hooks/queries/useRoomsQuery';

const SpacesTabs = () => {
  const { data: rooms } = useRoomsQuery({});
  const totalRooms = rooms?.length ?? 0;
  const activeRooms = rooms?.filter(r => r.status === 'active').length ?? 0;

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      {/* Header with room counts */}
      <div className="border-b shrink-0 bg-background">
        <div className="flex items-center justify-between px-1 pt-2 pb-2">
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
      <div className="min-w-0 flex-1 min-h-0">
        <RoomsPage />
      </div>
    </div>
  );
};

export default SpacesTabs;
