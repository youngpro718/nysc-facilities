
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { OccupantQueryResponse } from "../types/occupantTypes";

interface LocationSectionProps {
  occupantData: OccupantQueryResponse;
}

export function LocationSection({ occupantData }: LocationSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">Assigned Rooms</p>
          <div className="text-sm text-muted-foreground">
            {occupantData.rooms && occupantData.rooms.length > 0 ? (
              occupantData.rooms.map((room, index) => (
                <div key={index}>
                  {room.floors?.buildings?.name && `${room.floors.buildings.name} - `}
                  {room.room_number || room.name}
                </div>
              ))
            ) : (
              "No rooms assigned"
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
