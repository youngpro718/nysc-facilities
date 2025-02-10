
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Lightbulb, 
  Zap, 
  Scale,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RoomLightingDialog } from "./RoomLightingDialog";
import { AssignFixtureDialog } from "./AssignFixtureDialog";
import type { LightingFixture, RoomLightingConfig as RoomLightingConfigType } from "@/components/lighting/types";

interface RoomLightingConfigProps {
  roomId: string;
}

interface GroupedFixtures {
  [position: string]: LightingFixture[];
}

export function RoomLightingConfig({ roomId }: RoomLightingConfigProps) {
  const [isEditing, setIsEditing] = useState(false);

  const { data: fixtures, isLoading, refetch } = useQuery({
    queryKey: ['room-lighting', roomId],
    queryFn: async () => {
      console.log("Fetching lighting fixtures for room:", roomId);
      
      const { data: fixtureData, error } = await supabase
        .from('lighting_fixture_details')
        .select('*')
        .eq('space_id', roomId)
        .eq('space_type', 'room');

      if (error) {
        console.error('Error fetching lighting fixtures:', error);
        toast.error('Failed to load lighting configuration');
        throw error;
      }

      console.log("Fixture data:", fixtureData);

      // Transform the data to match LightingFixture type
      return (fixtureData || []).map(fixture => ({
        id: fixture.id,
        name: fixture.name,
        type: fixture.type,
        status: fixture.status,
        zone_id: fixture.zone_id,
        technology: fixture.technology || "LED",
        position: fixture.position,
        sequence_number: fixture.sequence_number,
        bulb_count: fixture.bulb_count,
        emergency_circuit: fixture.emergency_circuit,
        ballast_issue: fixture.ballast_issue,
        maintenance_notes: fixture.maintenance_notes,
        ballast_check_notes: fixture.ballast_check_notes,
        electrical_issues: fixture.electrical_issues || {
          short_circuit: false,
          wiring_issues: false,
          voltage_problems: false
        },
        energy_usage_data: fixture.energy_usage_data ? {
          daily_usage: [],
          efficiency_rating: null,
          last_reading: null,
          ...JSON.parse(JSON.stringify(fixture.energy_usage_data))
        } : null,
        emergency_protocols: fixture.emergency_protocols ? {
          emergency_contact: null,
          backup_system: false,
          evacuation_route: false,
          ...JSON.parse(JSON.stringify(fixture.emergency_protocols))
        } : null,
        warranty_info: fixture.warranty_info ? {
          start_date: null,
          end_date: null,
          provider: null,
          terms: null,
          ...JSON.parse(JSON.stringify(fixture.warranty_info))
        } : null,
        manufacturer_details: fixture.manufacturer_details ? {
          name: null,
          model: null,
          serial_number: null,
          support_contact: null,
          ...JSON.parse(JSON.stringify(fixture.manufacturer_details))
        } : null,
        inspection_history: fixture.inspection_history || [],
        maintenance_history: fixture.maintenance_history || [],
        connected_fixtures: fixture.connected_fixtures || []
      })) as LightingFixture[];
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Loading lighting configuration...</span>
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const groupedFixtures = fixtures?.reduce<GroupedFixtures>((acc, fixture) => {
    const position = fixture.position || 'unknown';
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(fixture);
    return acc;
  }, {}) || {};

  // Transform LightingFixture to RoomLightingConfig
  const transformToRoomConfig = (fixture: LightingFixture): RoomLightingConfigType => ({
    id: fixture.id,
    room_id: roomId,
    name: fixture.name,
    zone_id: fixture.zone_id,
    type: fixture.type,
    technology: fixture.technology || "LED",
    bulb_count: fixture.bulb_count,
    status: fixture.status,
    maintenance_notes: fixture.maintenance_notes,
    electrical_issues: fixture.electrical_issues || {
      short_circuit: false,
      wiring_issues: false,
      voltage_problems: false
    },
    ballast_issue: fixture.ballast_issue,
    ballast_check_notes: fixture.ballast_check_notes,
    emergency_circuit: fixture.emergency_circuit,
    position: fixture.position,
    sequence_number: fixture.sequence_number
  });

  const workingFixtures = fixtures?.filter(f => f.status === 'functional').length || 0;
  const totalFixtures = fixtures?.length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Lighting Configuration</span>
            <Badge variant="outline" className="text-xs">
              {workingFixtures}/{totalFixtures} Working
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {fixtures && fixtures.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            )}
            <AssignFixtureDialog 
              roomId={roomId} 
              onAssignmentComplete={refetch}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {fixtures && fixtures.length > 0 ? (
          <div className="space-y-6">
            {/* Progress bar for working fixtures */}
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{
                    width: `${totalFixtures ? (workingFixtures / totalFixtures) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total Fixtures: {totalFixtures}</span>
                <span className="font-medium text-green-500">
                  {Math.round((workingFixtures / totalFixtures) * 100) || 0}% Operational
                </span>
              </div>
            </div>

            {Object.entries(groupedFixtures).map(([position, positionFixtures]) => (
              <div key={position} className="space-y-4">
                <h3 className="font-medium capitalize">{position} Fixtures</h3>
                <div className="space-y-4">
                  {positionFixtures.map((fixture) => (
                    <div key={fixture.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-primary" />
                          <span>{fixture.name}</span>
                        </div>
                        <Badge variant={fixture.status === 'functional' ? 'default' : 'destructive'}>
                          {fixture.status}
                        </Badge>
                      </div>

                      {fixture.technology && (
                        <div className="text-sm text-muted-foreground">
                          Technology: {fixture.technology}
                        </div>
                      )}

                      {fixture.electrical_issues && (
                        Object.entries(fixture.electrical_issues).some(([_, value]) => value) && (
                          <div className="flex items-center gap-2 text-red-600">
                            <Zap className="h-4 w-4" />
                            <span className="text-sm">Electrical Issues Detected</span>
                          </div>
                        )
                      )}

                      {fixture.ballast_issue && (
                        <div className="flex items-center gap-2 text-orange-600">
                          <Scale className="h-4 w-4" />
                          <span className="text-sm">Ballast Issue Present</span>
                        </div>
                      )}

                      {fixture.emergency_circuit && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm">Emergency Circuit</span>
                        </div>
                      )}

                      {fixture.maintenance_notes && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-semibold">Maintenance Notes:</span> {fixture.maintenance_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No lighting fixtures assigned
          </div>
        )}
      </CardContent>

      {isEditing && fixtures && fixtures[0] && (
        <RoomLightingDialog
          open={isEditing}
          onOpenChange={setIsEditing}
          roomId={roomId}
          initialData={transformToRoomConfig(fixtures[0])}
        />
      )}
    </Card>
  );
}
