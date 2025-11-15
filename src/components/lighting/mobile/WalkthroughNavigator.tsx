import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, MapPin, Lightbulb } from "lucide-react";
import { startWalkthrough } from "@/services/walkthroughService";
import { toast } from "sonner";

interface WalkthroughNavigatorProps {
  onStartWalkthrough: (sessionId: string, hallwayId: string, floorId: string) => void;
}

export function WalkthroughNavigator({ onStartWalkthrough }: WalkthroughNavigatorProps) {
  const [selectedFloor, setSelectedFloor] = useState<string>("");
  const [selectedHallway, setSelectedHallway] = useState<string>("");
  const [isStarting, setIsStarting] = useState(false);

  // Fetch floors
  const { data: floors } = useQuery({
    queryKey: ['building-floors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('building_floors')
        .select('id, name, floor_number, buildings(name)')
        .order('floor_number');
      if (error) throw error;
      return data;
    }
  });

  // Fetch hallways for selected floor
  const { data: hallways } = useQuery({
    queryKey: ['hallways', selectedFloor],
    queryFn: async () => {
      if (!selectedFloor) return [];
      
      const { data, error } = await supabase
        .from('hallways')
        .select(`
          id,
          name,
          code,
          tier,
          estimated_walk_time_seconds
        `)
        .eq('floor_id', selectedFloor)
        .order('tier', { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedFloor
  });

  // Get fixture count for hallway
  const { data: fixtureCount } = useQuery({
    queryKey: ['hallway-fixtures-count', selectedHallway],
    queryFn: async () => {
      if (!selectedHallway) return { total: 0, issues: 0 };
      
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select('id, status')
        .eq('space_id', selectedHallway)
        .eq('space_type', 'hallway');
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const issues = data?.filter(f => f.status !== 'functional').length || 0;
      
      return { total, issues };
    },
    enabled: !!selectedHallway
  });

  const handleStartWalkthrough = async () => {
    if (!selectedFloor || !selectedHallway) {
      toast.error("Please select a floor and hallway");
      return;
    }

    setIsStarting(true);
    try {
      const session = await startWalkthrough(selectedHallway, selectedFloor);
      toast.success("Walkthrough started!");
      onStartWalkthrough(session.id, selectedHallway, selectedFloor);
    } catch (error: any) {
      toast.error(error.message || "Failed to start walkthrough");
    } finally {
      setIsStarting(false);
    }
  };

  const getTierLabel = (tier: string | null) => {
    const labels: Record<string, string> = {
      main: 'Main',
      connector: 'Connector',
      wing: 'Wing',
      private: 'Private'
    };
    return tier ? labels[tier] || tier : '';
  };

  const getTierColor = (tier: string | null) => {
    const colors: Record<string, string> = {
      main: 'bg-blue-500',
      connector: 'bg-green-500',
      wing: 'bg-purple-500',
      private: 'bg-gray-500'
    };
    return tier ? colors[tier] || 'bg-gray-400' : 'bg-gray-400';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Start Lighting Walkthrough
        </CardTitle>
        <CardDescription>
          Select a floor and hallway to begin inspecting lighting fixtures
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Floor Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Floor</label>
          <Select value={selectedFloor} onValueChange={setSelectedFloor}>
            <SelectTrigger>
              <SelectValue placeholder="Select a floor" />
            </SelectTrigger>
            <SelectContent>
              {floors?.map((floor) => (
                <SelectItem key={floor.id} value={floor.id}>
                  {floor.name} - {(floor.buildings as any)?.name || 'Building'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hallway Selection */}
        {selectedFloor && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Hallway</label>
            <Select value={selectedHallway} onValueChange={setSelectedHallway}>
              <SelectTrigger>
                <SelectValue placeholder="Select a hallway" />
              </SelectTrigger>
              <SelectContent>
                {hallways?.map((hallway) => (
                  <SelectItem key={hallway.id} value={hallway.id}>
                    <div className="flex items-center gap-2">
                      <span>{hallway.code || hallway.name}</span>
                      {hallway.tier && (
                        <Badge variant="secondary" className="text-xs">
                          {getTierLabel(hallway.tier)}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Hallway Info */}
        {selectedHallway && fixtureCount && (
          <Card className="bg-muted">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Fixtures</p>
                    <p className="text-2xl font-bold">{fixtureCount.total}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-destructive" />
                  <div>
                    <p className="text-sm text-muted-foreground">Known Issues</p>
                    <p className="text-2xl font-bold">{fixtureCount.issues}</p>
                  </div>
                </div>
              </div>
              {hallways?.find(h => h.id === selectedHallway)?.estimated_walk_time_seconds && (
                <p className="text-sm text-muted-foreground mt-4">
                  Estimated time: ~
                  {Math.ceil((hallways.find(h => h.id === selectedHallway)?.estimated_walk_time_seconds || 0) / 60)} 
                  {' '}minutes
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Start Button */}
        <Button
          onClick={handleStartWalkthrough}
          disabled={!selectedFloor || !selectedHallway || isStarting}
          className="w-full"
          size="lg"
        >
          <Play className="h-5 w-5 mr-2" />
          {isStarting ? 'Starting...' : 'Start Walkthrough'}
        </Button>
      </CardContent>
    </Card>
  );
}
