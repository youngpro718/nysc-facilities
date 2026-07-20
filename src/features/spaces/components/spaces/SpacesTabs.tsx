import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import RoomsPage from './views/RoomsPage';
import { useRoomsQuery } from './hooks/queries/useRoomsQuery';
import { CommonAreasPage } from './common-areas/CommonAreasPage';
import { useCommonAreas } from './common-areas/useCommonAreas';

interface SpacesTabsProps {
  /** Page-level actions (e.g. Add Room) rendered in the header row. */
  actions?: React.ReactNode;
}

const SpacesTabs = ({ actions }: SpacesTabsProps) => {
  const [activeView, setActiveView] = useState<'rooms' | 'common-areas'>('rooms');
  const { data: rooms } = useRoomsQuery({});
  const { data: commonAreas } = useCommonAreas();
  const totalRooms = rooms?.length ?? 0;
  const activeRooms = rooms?.filter(r => r.status === 'active').length ?? 0;
  const totalCommonAreas = commonAreas?.length ?? 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <Tabs
        value={activeView}
        onValueChange={(value) => setActiveView(value as 'rooms' | 'common-areas')}
        className="shrink-0"
      >
        <div className="border-b bg-background">
        <div className="flex flex-col gap-3 px-1 pb-3 pt-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Spaces</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Rooms and shared floor areas are tracked separately.</p>
          </div>
          <div className="flex items-center gap-2">
          {actions}
          <TabsList className="h-9 min-h-9 w-full justify-start sm:w-auto">
            <TabsTrigger value="rooms" className="min-h-8 gap-2 px-3 py-1.5">
              Rooms
              <Badge
                variant="outline"
                className={cn(
                  "h-5 min-w-5 justify-center px-1 text-[10px]",
                  activeView === 'rooms'
                    ? "border-primary-foreground/30 text-primary-foreground"
                    : "border-current/20"
                )}
              >
                {totalRooms}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="common-areas" className="min-h-8 gap-2 px-3 py-1.5">
              Common areas
              <Badge
                variant="outline"
                className={cn(
                  "h-5 min-w-5 justify-center px-1 text-[10px]",
                  activeView === 'common-areas'
                    ? "border-primary-foreground/30 text-primary-foreground"
                    : "border-current/20"
                )}
              >
                {totalCommonAreas}
              </Badge>
            </TabsTrigger>
          </TabsList>
          </div>
        </div>
        </div>
      </Tabs>

      {activeView === 'rooms' ? (
        <div className="min-h-0 flex-1">
        <div className="mb-2 hidden items-center gap-2 sm:flex">
          {totalRooms > 0 && (
            <>
              <Badge variant="outline" className="text-xs">{totalRooms} Total</Badge>
              <Badge variant="secondary" className="text-xs">{activeRooms} Active</Badge>
            </>
          )}
        </div>
        <RoomsPage />
        </div>
      ) : (
        <div className="min-h-0 flex-1">
        <CommonAreasPage />
        </div>
      )}
    </div>
  );
};

export default SpacesTabs;
