import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, Wrench } from "lucide-react";
import { MaintenanceDialog } from "./dialogs/MaintenanceDialog";
import { InspectionDialog } from "./dialogs/InspectionDialog";
import { ElectricalIssuesDialog } from "./dialogs/ElectricalIssuesDialog";
import { LightingFixture } from "./types";

export function MaintenanceView() {
  const { data: fixtures, refetch } = useQuery({
    queryKey: ['lighting_fixtures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select(`
          *,
          buildings!lighting_fixtures_building_id_fkey (
            name
          ),
          floors!lighting_fixtures_floor_id_fkey (
            name
          ),
          maintenance_records!lighting_fixtures_id_fkey (
            id,
            date,
            type,
            notes
          ),
          inspection_records!lighting_fixtures_id_fkey (
            id,
            date,
            status,
            notes
          )
        `)
        .order('name');
      
      if (error) throw error;

      // Transform the data to match our LightingFixture type
      return data.map((fixture: any) => ({
        ...fixture,
        building_name: fixture.buildings?.name || null,
        floor_name: fixture.floors?.name || null,
        maintenance_records: fixture.maintenance_records || [],
        inspection_records: fixture.inspection_records || []
      })) as LightingFixture[];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'functional':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'maintenance_needed':
        return <Wrench className="h-4 w-4 text-yellow-600" />;
      case 'non_functional':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getLastMaintenanceDate = (fixture: LightingFixture) => {
    if (!fixture.maintenance_records?.length) return 'Never';
    const dates = fixture.maintenance_records.map(r => new Date(r.date));
    return new Date(Math.max(...dates.map(d => d.getTime()))).toLocaleDateString();
  };

  const getLastInspectionDate = (fixture: LightingFixture) => {
    if (!fixture.inspection_records?.length) return 'Never';
    const dates = fixture.inspection_records.map(r => new Date(r.date));
    return new Date(Math.max(...dates.map(d => d.getTime()))).toLocaleDateString();
  };

  return (
    <div className="p-6">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fixture</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Maintenance</TableHead>
              <TableHead>Last Inspection</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fixtures?.map((fixture) => (
              <TableRow key={fixture.id}>
                <TableCell className="font-medium">{fixture.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(fixture.status)}
                    <span className="capitalize">{fixture.status.replace(/_/g, ' ')}</span>
                  </div>
                </TableCell>
                <TableCell>{getLastMaintenanceDate(fixture)}</TableCell>
                <TableCell>{getLastInspectionDate(fixture)}</TableCell>
                <TableCell>
                  {fixture.building_name} - {fixture.floor_name}
                  {fixture.room_number && ` (Room ${fixture.room_number})`}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MaintenanceDialog
                      fixture={fixture}
                      onComplete={refetch}
                    />
                    <InspectionDialog
                      fixture={fixture}
                      onComplete={refetch}
                    />
                    <ElectricalIssuesDialog
                      fixture={fixture}
                      onComplete={refetch}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 