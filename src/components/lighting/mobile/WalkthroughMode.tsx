
import { useState, useMemo } from "react";
import { logger } from '@/lib/logger';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LightingFixture } from "@/types/lighting";
import { ChevronRight, ArrowLeft, Lightbulb, Zap, CheckCircle, AlertTriangle } from "lucide-react";
import { markLightsOut, markLightsFixed, toggleElectricianRequired } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WalkthroughModeProps {
  fixtures: LightingFixture[];
  onExit: () => void;
  onFixtureUpdate: () => void;
}

type ViewState = 'buildings' | 'floors' | 'spaces' | 'fixtures';

export function WalkthroughMode({ fixtures, onExit, onFixtureUpdate }: WalkthroughModeProps) {
  const [viewState, setViewState] = useState<ViewState>('buildings');
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<{ id: string; name: string; type: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // derived data for hierarchy
  const hierarchy = useMemo(() => {
    const buildings = new Map<string, Map<string, Map<string, LightingFixture[]>>>();

    fixtures.forEach(f => {
      const bName = f.building_name || 'Unknown Building';
      const fName = f.floor_name || 'Unknown Floor';
      // Construct a unique space key and display name
      const sId = f.space_id || `unknown-${f.room_number || 'no-room'}`;
      const sName = f.space_name 
        ? f.space_name 
        : (f.room_number ? `Room ${f.room_number}` : 'Unknown Space');
      
      if (!buildings.has(bName)) {
        buildings.set(bName, new Map());
      }
      const floors = buildings.get(bName)!;
      
      if (!floors.has(fName)) {
        floors.set(fName, new Map());
      }
      const spaces = floors.get(fName)!;
      
      // Use a composite key to store distinct spaces
      const spaceKey = JSON.stringify({ id: sId, name: sName, type: f.space_type });
      if (!spaces.has(spaceKey)) {
        spaces.set(spaceKey, []);
      }
      spaces.get(spaceKey)!.push(f);
    });

    return buildings;
  }, [fixtures]);

  const currentFloors = useMemo(() => {
    if (!selectedBuilding) return new Map();
    return hierarchy.get(selectedBuilding) || new Map();
  }, [hierarchy, selectedBuilding]);

  const currentSpaces = useMemo(() => {
    if (!selectedFloor) return new Map();
    return currentFloors.get(selectedFloor) || new Map();
  }, [currentFloors, selectedFloor]);

  const currentFixtures = useMemo(() => {
    if (!selectedSpace) return [];
    const spaceKey = JSON.stringify(selectedSpace);
    const list = currentSpaces.get(spaceKey) || [];
    // Sort by sequence number
    return list.sort((a, b) => (a.sequence_number || 999) - (b.sequence_number || 999));
  }, [currentSpaces, selectedSpace]);

  // Handlers
  const handleFixtureAction = async (fixture: LightingFixture, action: 'bulb' | 'ballast' | 'fix') => {
    setProcessingId(fixture.id);
    try {
      if (action === 'fix') {
        await markLightsFixed([fixture.id]);
        toast.success("Marked as fixed");
      } else if (action === 'bulb') {
        // If already out (bulb) and clicked again, maybe do nothing or toggle? 
        // Assuming this button is only shown when appropriate
        await markLightsOut([fixture.id], false);
        toast.success("Reported bulb issue");
      } else if (action === 'ballast') {
        // If functional, mark out + electrician. If out, toggle electrician.
        if (fixture.status === 'functional') {
          await markLightsOut([fixture.id], true);
        } else {
           // if already out, ensure electrician is required
           if (!fixture.requires_electrician) {
             await toggleElectricianRequired([fixture.id], true);
           }
        }
        toast.success("Reported ballast/electrician issue");
      }
      onFixtureUpdate();
    } catch (e) {
      logger.error('Failed to update fixture:', e);
      toast.error("Failed to update fixture");
    } finally {
      setProcessingId(null);
    }
  };

  // Navigation renderers
  const renderHeader = (title: string, onBack: () => void) => (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4 flex items-center gap-3">
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <h2 className="font-semibold text-lg">{title}</h2>
    </div>
  );

  if (viewState === 'buildings') {
    return (
      <div className="flex flex-col h-full">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onExit}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="font-semibold text-lg">Select Building</h2>
            </div>
        </div>
        <div className="p-4 space-y-3">
          {Array.from(hierarchy.keys()).map(bName => (
            <Card 
              key={bName} 
              className="p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => {
                setSelectedBuilding(bName);
                setViewState('floors');
              }}
            >
              <span className="font-medium">{bName}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (viewState === 'floors') {
    return (
      <div className="flex flex-col h-full">
        {renderHeader(selectedBuilding || 'Building', () => {
          setSelectedBuilding(null);
          setViewState('buildings');
        })}
        <div className="p-4 space-y-3">
          {Array.from(currentFloors.keys()).map((fName) => (
            <Card 
              key={fName as string} 
              className="p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => {
                setSelectedFloor(fName as string);
                setViewState('spaces');
              }}
            >
              <span className="font-medium">{fName as string}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (viewState === 'spaces') {
    return (
      <div className="flex flex-col h-full">
        {renderHeader(`${selectedBuilding} • ${selectedFloor}`, () => {
          setSelectedFloor(null);
          setViewState('floors');
        })}
        <div className="p-4 space-y-3">
          {Array.from(currentSpaces.keys()).map((spaceKey) => {
            const keyStr = spaceKey as string;
            const space = JSON.parse(keyStr);
            const fixturesInSpace = currentSpaces.get(keyStr) || [];
            const issues = fixturesInSpace.filter(f => f.status !== 'functional').length;
            
            return (
              <Card 
                key={keyStr} 
                className="p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => {
                  setSelectedSpace(space);
                  setViewState('fixtures');
                }}
              >
                <div className="flex flex-col">
                    <span className="font-medium">{space.name}</span>
                    <span className="text-xs text-muted-foreground">{fixturesInSpace.length} fixtures</span>
                </div>
                <div className="flex items-center gap-3">
                    {issues > 0 && (
                        <Badge variant="destructive" className="text-xs">
                            {issues} issues
                        </Badge>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // FIXTURE LIST VIEW - The core walkthrough experience
  return (
    <div className="flex flex-col h-full bg-muted/10">
      {renderHeader(selectedSpace?.name || 'Space', () => {
        setSelectedSpace(null);
        setViewState('spaces');
      })}
      
      <div className="p-4 space-y-4 pb-20">
        {currentFixtures.map((fixture, index) => {
            const isProcessing = processingId === fixture.id;
            const isFunctional = fixture.status === 'functional';
            const isElectrician = fixture.requires_electrician;
            
            return (
                <Card key={fixture.id} className={cn(
                    "overflow-hidden transition-all duration-200",
                    !isFunctional ? "border-l-4 border-l-destructive" : "border-l-4 border-l-green-500"
                )}>
                    <div className="p-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-muted-foreground">#{index + 1}</span>
                                    <h3 className="font-semibold text-lg">
                                        {fixture.position} Light
                                    </h3>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {fixture.name}
                                </p>
                            </div>
                            <Badge variant={isFunctional ? "outline" : "destructive"} className="ml-2">
                                {isFunctional ? "OK" : (isElectrician ? "Ballast" : "Bulb")}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Action Buttons - Large touch targets */}
                            {isFunctional ? (
                                <>
                                    <Button 
                                        variant="outline" 
                                        className="h-14 flex flex-col gap-1 border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => handleFixtureAction(fixture, 'bulb')}
                                        disabled={isProcessing}
                                    >
                                        <Lightbulb className="h-5 w-5" />
                                        <span className="text-xs">Bulb Out</span>
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="h-14 flex flex-col gap-1 border-orange-500/20 hover:bg-orange-500/10 hover:text-orange-600"
                                        onClick={() => handleFixtureAction(fixture, 'ballast')}
                                        disabled={isProcessing}
                                    >
                                        <Zap className="h-5 w-5" />
                                        <span className="text-xs">Ballast Issue</span>
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button 
                                        className="h-14 flex flex-col gap-1 col-span-2 bg-green-600 hover:bg-green-700"
                                        onClick={() => handleFixtureAction(fixture, 'fix')}
                                        disabled={isProcessing}
                                    >
                                        <CheckCircle className="h-5 w-5" />
                                        <span className="text-xs">Mark Fixed</span>
                                    </Button>
                                    
                                    {/* Refine issue type if already out */}
                                    {!isFunctional && (
                                        <div className="col-span-2 flex gap-2 mt-1">
                                             <Button 
                                                variant={!isElectrician ? "default" : "outline"}
                                                size="sm"
                                                className="flex-1 text-xs h-8"
                                                onClick={() => handleFixtureAction(fixture, 'bulb')}
                                                disabled={isProcessing || !isElectrician} // Disabled if already bulb
                                            >
                                                Bulb
                                            </Button>
                                            <Button 
                                                variant={isElectrician ? "destructive" : "outline"}
                                                size="sm"
                                                className="flex-1 text-xs h-8"
                                                onClick={() => handleFixtureAction(fixture, 'ballast')}
                                                disabled={isProcessing || isElectrician} // Disabled if already ballast
                                            >
                                                Ballast
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </Card>
            );
        })}
        
        {currentFixtures.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
                No fixtures found in this space.
            </div>
        )}
      </div>
    </div>
  );
}
