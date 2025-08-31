import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, MapPin, Search, Settings, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CreateLightingDialog } from "../../CreateLightingDialog";
import { AssignZoneDialog } from "../../components/AssignZoneDialog";
import { ZoneControls } from "../../components/ZoneControls";
import { toast } from "sonner";

export function ZonesManagementView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: zones, isLoading, refetch } = useQuery({
    queryKey: ['lighting_zones'],
    queryFn: () => fetchLightingZones()
  });

  const filteredZones = zones?.filter(zone =>
    zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.type.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleZoneCreated = () => {
    refetch();
    toast.success("Zone created successfully");
  };

  const getZoneTypeColor = (type: string) => {
    switch (type) {
      case 'emergency':
        return 'destructive';
      case 'restricted':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getZoneTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return '🚨';
      case 'restricted':
        return '🔒';
      default:
        return '💡';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search zones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <CreateLightingDialog 
            onFixtureCreated={() => {}}
            onZoneCreated={handleZoneCreated}
          />
        </div>
      </div>

      {/* Zones Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredZones.map((zone) => (
          <Card key={zone.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getZoneTypeIcon(zone.type)}</span>
                  <div>
                    <CardTitle className="text-base">{zone.name}</CardTitle>
                    <CardDescription className="text-xs">
                      Zone ID: {zone.id.slice(0, 8)}...
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={getZoneTypeColor(zone.type)} className="text-xs">
                  {zone.type}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <ZoneControls 
                zoneId={zone.id}
                zoneName={zone.name}
                zoneType={zone.type}
              />
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setSelectedZone(zone.id)}
                >
                  <Users className="h-3 w-3 mr-1" />
                  Assign Fixtures
                </Button>
                
                <Button variant="outline" size="sm">
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredZones.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <CardContent>
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No zones found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? "Try adjusting your search terms" 
                : "Create your first lighting zone to get started"
              }
            </p>
            <CreateLightingDialog 
              onFixtureCreated={() => {}}
              onZoneCreated={handleZoneCreated}
            />
          </CardContent>
        </Card>
      )}

      {selectedZone && (
        <AssignZoneDialog
          selectedFixtures={[]} // This would come from parent selection state
          onComplete={() => {
            setSelectedZone(null);
            queryClient.invalidateQueries({ queryKey: ['lighting_fixtures'] });
          }}
        />
      )}
    </div>
  );
}