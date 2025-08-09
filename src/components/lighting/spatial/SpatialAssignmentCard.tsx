
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, Home } from "lucide-react";
import { LightingFixture } from "@/types/lighting";

interface SpatialAssignmentCardProps {
  fixture: LightingFixture;
  onEdit: () => void;
}

export const SpatialAssignmentCard = ({ fixture, onEdit }: SpatialAssignmentCardProps) => {
  const getSpaceTypeIcon = (type?: 'room' | 'hallway') => {
    switch (type) {
      case 'room':
        return <Home className="h-4 w-4" />;
      case 'hallway':
        return <Building2 className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Location Assignment
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getSpaceTypeIcon(fixture.spatial_assignment?.space_type)}
              <span className="text-sm">
                {fixture.spatial_assignment?.space_type === 'room' ? 'Room' : 'Hallway'}
              </span>
            </div>
            <Badge variant="outline">
              Position {fixture.spatial_assignment?.position || 'Not Set'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Sequence #{fixture.spatial_assignment?.sequence_number || 'N/A'}</span>
          </div>

          {fixture.emergency_circuit && (
            <div className="mt-4">
              <Badge variant="destructive" className="gap-2">
                Emergency Circuit
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
