import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { LightingFixture } from "@/types/lighting";
import { LightingFixtureCard } from "@/components/lighting/card/LightingFixtureCard";
import { AlertTriangle, CheckCircle, Lightbulb, MapPin } from "lucide-react";

interface RoomSlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  roomNumber: string;
  roomName: string;
  buildingName?: string;
  floorName?: string;
  fixtures: LightingFixture[];
  onFixtureUpdated: () => void;
  onFixtureDelete: (fixtureId: string) => void;
  selectedFixtures: string[];
  onFixtureSelect: (fixtureId: string, selected: boolean) => void;
}

export function RoomSlideOver({ open, onOpenChange, roomId, roomNumber, roomName, buildingName, floorName, fixtures, onFixtureUpdated, onFixtureDelete, selectedFixtures, onFixtureSelect }: RoomSlideOverProps) {
  const stats = useMemo(() => {
    const total = fixtures.length;
    const working = fixtures.filter(f => f.status === 'functional').length;
    const issues = total - working;
    const emergency = fixtures.filter(f => f.emergency_circuit).length;
    return { total, working, issues, emergency };
  }, [fixtures]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl w-full">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {roomNumber}
          </SheetTitle>
          <SheetDescription>
            {roomName}
            {buildingName && floorName && (
              <span className="ml-2 text-xs text-muted-foreground">• {buildingName} • {floorName}</span>
            )}
          </SheetDescription>
        </SheetHeader>

        {/* Room stats */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline">{stats.total} fixtures</Badge>
          <Badge variant="outline" className="inline-flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {stats.working} working</Badge>
          {stats.issues > 0 && (
            <Badge variant="secondary" className="inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {stats.issues} issues</Badge>
          )}
          {stats.emergency > 0 && (
            <Badge variant="outline" className="inline-flex items-center gap-1"><Lightbulb className="h-3 w-3" /> {stats.emergency} emergency</Badge>
          )}
        </div>

        {/* Fixtures grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fixtures.map((fixture) => (
            <LightingFixtureCard
              key={fixture.id}
              fixture={fixture}
              isSelected={selectedFixtures.includes(fixture.id)}
              onSelect={(checked) => onFixtureSelect(fixture.id, checked)}
              onDelete={() => onFixtureDelete(fixture.id)}
              onFixtureUpdated={onFixtureUpdated}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
