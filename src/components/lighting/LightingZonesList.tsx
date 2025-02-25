import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit2, Eye, Info, Layers, Link2, MapPin, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { EditLightingZoneDialog } from "./EditLightingZoneDialog";
import { ZoneControls } from "./components/ZoneControls";

type LightingZone = {
  id: string;
  name: string;
  floor_id: string | null;
  type: string;
  floors: {
    name: string;
  } | null;
  lighting_fixtures: {
    id: string;
    name: string;
    type: string;
    status: string;
  }[];
};

interface LightingZonesListProps {
  selectedBuilding: string;
  selectedFloor: string;
}

export function LightingZonesList({ selectedBuilding, selectedFloor }: LightingZonesListProps) {
  const { data: zones, isLoading, refetch } = useQuery({
    queryKey: ['lighting_zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_zones')
        .select(`
          *,
          floors:floor_id(name),
          lighting_fixtures(id, name, type, status)
        `)
        .order('name');
      
      if (error) throw error;
      return data as LightingZone[];
    },
  });

  const handleDeleteZone = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lighting_zones')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Lighting zone deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete lighting zone");
    }
  };

  const getZoneTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'restricted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Lighting Zones</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {zones?.map((zone) => (
          <Card key={zone.id} className="p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  {zone.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={getZoneTypeColor(zone.type)}>
                    {zone.type}
                  </Badge>
                  {zone.floors?.name && (
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      {zone.floors.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Layers className="h-4 w-4" />
                <span>{zone.lighting_fixtures?.length || 0} Fixtures</span>
              </div>

              {zone.lighting_fixtures && zone.lighting_fixtures.length > 0 && (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Fixtures
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                      <div className="space-y-2">
                        {zone.lighting_fixtures.map((fixture) => (
                          <div key={fixture.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Info className="h-4 w-4" />
                              <span>{fixture.name}</span>
                            </div>
                            <Badge>{fixture.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </HoverCardContent>
                </HoverCard>
              )}

              <ZoneControls
                zoneId={zone.id}
                zoneName={zone.name}
                zoneType={zone.type}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <EditLightingZoneDialog 
                zone={zone}
                onZoneUpdated={refetch}
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Lighting Zone</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this lighting zone? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteZone(zone.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        ))}

        {(!zones || zones.length === 0) && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No lighting zones found
          </div>
        )}
      </div>
    </div>
  );
}