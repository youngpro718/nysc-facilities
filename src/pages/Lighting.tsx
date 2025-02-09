
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateLightingDialog } from "@/components/lighting/CreateLightingDialog";
import { EditLightingDialog } from "@/components/lighting/EditLightingDialog";
import { useLightingFixtures } from "@/components/lighting/hooks/useLightingFixtures";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function Lighting() {
  const { fixtures, refetch, handleDelete } = useLightingFixtures();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lighting Management</h1>
        <CreateLightingDialog 
          onFixtureCreated={refetch}
          onZoneCreated={refetch}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fixtures?.map((fixture) => (
          <Card key={fixture.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-bold">{fixture.name}</CardTitle>
              <div className="flex space-x-2">
                <EditLightingDialog fixture={fixture} onFixtureUpdated={refetch} />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleDelete(fixture.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><span className="font-semibold">Type:</span> {fixture.type}</p>
                <p><span className="font-semibold">Status:</span> {fixture.status}</p>
                <p><span className="font-semibold">Zone:</span> {fixture.zone_name || 'Unassigned'}</p>
                <p><span className="font-semibold">Location:</span> {fixture.building_name} - {fixture.floor_name}</p>
                {fixture.maintenance_notes && (
                  <p><span className="font-semibold">Notes:</span> {fixture.maintenance_notes}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
