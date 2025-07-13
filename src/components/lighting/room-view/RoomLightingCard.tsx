import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, MapPin, Lightbulb, AlertTriangle, CheckCircle, Settings } from "lucide-react";
import { LightingFixture } from "@/components/lighting/types";
import { LightingFixtureCard } from "@/components/lighting/card/LightingFixtureCard";
import { cn } from "@/lib/utils";

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
  onFixtureUpdated
}: RoomLightingCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
    if (issueFixtures === 0) return "secondary";
    if (issueFixtures > functionalFixtures) return "destructive";
    return "outline";
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
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">{roomNumber}</CardTitle>
                <p className="text-sm text-muted-foreground">{roomName}</p>
                {buildingName && floorName && (
                  <p className="text-xs text-muted-foreground">
                    {buildingName} • {floorName}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor()} className="font-medium">
              {getStatusText()}
            </Badge>
            <Badge variant="outline" className="font-medium">
              {totalFixtures} fixture{totalFixtures !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>{functionalFixtures} working</span>
            </div>
            {issueFixtures > 0 && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span>{issueFixtures} issues</span>
              </div>
            )}
            {emergencyFixtures > 0 && (
              <div className="flex items-center gap-1">
                <Lightbulb className="h-4 w-4 text-primary" />
                <span>{emergencyFixtures} emergency</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {totalFixtures > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAllRoom}
                className="h-8"
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={() => {}} // Controlled by onClick
                  className="mr-2"
                />
                Select All
              </Button>
            )}

            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
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