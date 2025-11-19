import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as locationUtil from "@/components/lighting/utils/location";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, MapPin, Lightbulb, AlertTriangle, CheckCircle, MoreVertical, Plus } from "lucide-react";
import { LightingFixture } from "@/types/lighting";
import { LightingFixtureCard } from "@/components/lighting/card/LightingFixtureCard";
import { CreateLightingDialog } from "../CreateLightingDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RoomLightingCardProps {
  roomId: string;
  roomNumber: string;
  roomName: string;
  buildingName?: string;
  floorName?: string;
  fixtures: LightingFixture[];
  selectedFixtures: string[];
  onFixtureSelect: (fixtureId: string, selected: boolean) => void;
  onFixtureDelete: (fixtureId: string) => void;
  onFixtureUpdated: () => void;
  defaultExpanded?: boolean;
}

export const RoomLightingCard = ({
  roomId,
  roomNumber,
  roomName,
  buildingName,
  floorName,
  fixtures,
  selectedFixtures,
  onFixtureSelect,
  onFixtureDelete,
  onFixtureUpdated,
  defaultExpanded
}: RoomLightingCardProps) => {
  const [isExpanded, setIsExpanded] = useState(!!defaultExpanded);
  // Slide-over removed per design change; expanding the card shows details

  const totalFixtures = fixtures.length;
  const functionalFixtures = fixtures.filter(f => f.status === 'functional').length;
  const issueFixtures = fixtures.filter(f => f.status !== 'functional').length;
  const emergencyFixtures = fixtures.filter(f => f.emergency_circuit).length;
  
  const statusSummary = {
    functional: functionalFixtures,
    issues: issueFixtures,
    emergency: emergencyFixtures,
    total: totalFixtures
  };

  const getStatusColor = () => {
    // Keep header neutral; use subtle warning when there are any issues
    if (issueFixtures === 0) return "secondary";
    return "destructive" as const;
  };

  const getStatusText = () => {
    if (issueFixtures === 0) return "All Working";
    if (issueFixtures === totalFixtures) return "All Issues";
    return `${issueFixtures} Issue${issueFixtures > 1 ? 's' : ''}`;
  };

  const toggleSelectAllRoom = () => {
    const allSelected = fixtures.every(f => selectedFixtures.includes(f.id));
    fixtures.forEach(fixture => {
      onFixtureSelect(fixture.id, !allSelected);
    });
  };

  const someSelected = fixtures.some(f => selectedFixtures.includes(f.id));
  const allSelected = fixtures.length > 0 && fixtures.every(f => selectedFixtures.includes(f.id));

  return (
    <Card id={`room-card-${roomId}`} className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0"
            onClick={() => setIsExpanded((v) => !v)}
            role="button"
            aria-expanded={isExpanded}
          >
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg truncate">
                {fixtures.length > 0
                  ? locationUtil.getFixtureLocationText(fixtures[0])
                  : (roomName && roomNumber
                      ? `${roomName} (${roomNumber.startsWith('#') ? roomNumber : `#${roomNumber}`})`
                      : roomName || roomNumber || 'Room')}
              </CardTitle>
              {buildingName && floorName && (
                <p className="text-xs text-muted-foreground truncate">
                  {buildingName} • {floorName}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <Badge variant={getStatusColor()} className="font-medium text-xs">
              {getStatusText()}
            </Badge>
            <Badge variant="outline" className="font-medium text-xs">
              {totalFixtures}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Room actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-1">
                  <CreateLightingDialog 
                    onFixtureCreated={onFixtureUpdated}
                    onZoneCreated={onFixtureUpdated}
                    initialSpaceId={roomId.includes('unknown') ? undefined : roomId}
                    initialSpaceType="room"
                    trigger={
                      <Button variant="ghost" size="sm" className="w-full justify-start h-8 px-2 font-normal">
                        <Plus className="h-4 w-4 mr-2" />
                        Quick Add Fixture
                      </Button>
                    }
                  />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleSelectAllRoom}>
                  Select all fixtures
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsExpanded((v) => !v)}>
                  {isExpanded ? 'Collapse' : 'Expand'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      const url = `${window.location.pathname}#room-card-${roomId}`;
                      await navigator.clipboard.writeText(url);
                      toast.success('Room link copied');
                    } catch (e) {
                      toast.error('Failed to copy link');
                    }
                  }}
                >
                  Copy link to room
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 gap-2">
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-success" />
              <span className="text-xs">{functionalFixtures} working</span>
            </div>
            {issueFixtures > 0 && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-warning" />
                <span className="text-xs">{issueFixtures} issues</span>
              </div>
            )}
            {emergencyFixtures > 0 && (
              <div className="flex items-center gap-1">
                <Lightbulb className="h-3 w-3 text-primary" />
                <span className="text-xs">{emergencyFixtures} emergency</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {totalFixtures > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAllRoom}
                className="h-7 text-xs px-2"
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={() => {}} // Controlled by onClick
                  className="mr-1 scale-75"
                />
                All
              </Button>
            )}

            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {fixtures.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No lighting fixtures assigned to this room</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

    </Card>
  );
};