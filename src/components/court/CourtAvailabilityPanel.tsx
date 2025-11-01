import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, AlertCircle, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useCourtIssuesIntegration } from "@/hooks/useCourtIssuesIntegration";

type CourtroomAvailability = {
  id: string;
  room_number: string;
  courtroom_number: string;
  maintenance_status: string;
  temporary_location: string;
  is_active: boolean;
  availability_status: string;
  maintenance_start_date: string;
  maintenance_end_date: string;
  room_name: string;
  floor_name: string;
  building_name: string;
};

interface CourtAvailabilityPanelProps {
  onSetTemporaryLocation: (courtroomId: string) => void;
}

export const CourtAvailabilityPanel = ({ onSetTemporaryLocation }: CourtAvailabilityPanelProps) => {
  const { getIssuesForRoom } = useCourtIssuesIntegration();
  const { data: courtrooms, isLoading, refetch } = useQuery({
    queryKey: ["courtroom-availability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("court_rooms")
        .select(`
          *,
          rooms(room_number, name)
        `)
        .order("room_number");
      if (error) throw error;
      return data as unknown as CourtroomAvailability[];
    },
  });

  const getAvailabilityIcon = (status: string) => {
    switch (status) {
      case "available": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "maintenance": return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case "inactive": return <Clock className="h-4 w-4 text-gray-400" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "maintenance": return "bg-orange-100 text-orange-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading courtroom availability...</div>;
  }

  const availableCount = courtrooms?.filter(c => c.availability_status === "available").length || 0;
  const maintenanceCount = courtrooms?.filter(c => c.availability_status === "maintenance").length || 0;
  const totalCount = courtrooms?.length || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Courtrooms</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableCount}</div>
            <p className="text-xs text-muted-foreground">Ready for proceedings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Maintenance</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{maintenanceCount}</div>
            <p className="text-xs text-muted-foreground">Temporarily unavailable</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courtrooms</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">All registered courtrooms</p>
          </CardContent>
        </Card>
      </div>

      {/* Courtroom List */}
      <div className="grid gap-4">
        {courtrooms?.map((courtroom) => (
          <Card key={courtroom.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getAvailabilityIcon(courtroom.availability_status)}
                    Courtroom {courtroom.courtroom_number || courtroom.room_number}
                    {getIssuesForRoom((courtroom as any).room_id).length > 0 && (
                      <Badge variant="destructive" className="text-[10px] px-1 py-0 h-5 leading-none flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {getIssuesForRoom((courtroom as any).room_id).length}
                        <span className="hidden sm:inline">open</span>
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {courtroom.room_name} - {courtroom.floor_name}, {courtroom.building_name}
                    </div>
                  </div>
                </div>
                <Badge className={getAvailabilityColor(courtroom.availability_status)}>
                  {courtroom.availability_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {courtroom.temporary_location && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800 font-medium">
                      <MapPin className="h-4 w-4" />
                      Temporary Location
                    </div>
                    <p className="text-sm mt-1 text-blue-700">{courtroom.temporary_location}</p>
                  </div>
                )}

                {courtroom.maintenance_start_date && (
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800 font-medium">
                      <Clock className="h-4 w-4" />
                      Maintenance Period
                    </div>
                    <p className="text-sm mt-1 text-orange-700">
                      {format(new Date(courtroom.maintenance_start_date), "MMM dd, yyyy")}
                      {courtroom.maintenance_end_date && 
                        ` - ${format(new Date(courtroom.maintenance_end_date), "MMM dd, yyyy")}`
                      }
                    </p>
                  </div>
                )}

                {courtroom.availability_status === "maintenance" && !courtroom.temporary_location && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => onSetTemporaryLocation(courtroom.id)}
                    >
                      Set Temporary Location
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courtrooms?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No courtrooms found
        </div>
      )}
    </div>
  );
};