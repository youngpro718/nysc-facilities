
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Edit2, Hash, LayoutDashboard, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertiesPanelProps {
  selectedObject: any | null;
  onEdit?: (object: any) => void;
}

export function PropertiesPanel({ selectedObject, onEdit }: PropertiesPanelProps) {
  if (!selectedObject) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          Select an object to view and edit its properties
        </p>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Properties</h3>
        <Button variant="outline" size="sm" onClick={() => onEdit?.(selectedObject)}>
          <Edit2 className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      <div className="space-y-4">
        {/* Basic Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Name:</span>
            <span>{selectedObject.label}</span>
          </div>

          {selectedObject.properties?.room_number && (
            <div className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Room Number:</span>
              <span>{selectedObject.properties.room_number}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Type:</span>
            <span className="capitalize">{selectedObject.type}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Status:</span>
            <Badge className={cn(
              "capitalize",
              getStatusColor(selectedObject.properties?.status)
            )}>
              {selectedObject.properties?.status || 'Unknown'}
            </Badge>
          </div>
        </div>

        {/* Dimensions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Dimensions</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Width:</span>{' '}
              {selectedObject.data?.size?.width || selectedObject.size?.width}px
            </div>
            <div>
              <span className="text-muted-foreground">Height:</span>{' '}
              {selectedObject.data?.size?.height || selectedObject.size?.height}px
            </div>
          </div>
        </div>

        {/* Additional Properties */}
        {selectedObject.type === 'room' && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Room Details</h4>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Occupancy:</span>
              <span>{selectedObject.properties?.occupancy || 'Not set'}</span>
            </div>
          </div>
        )}

        {selectedObject.type === 'hallway' && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Hallway Details</h4>
            <div className="text-sm">
              <span className="font-medium">Access Type:</span>{' '}
              <span className="capitalize">{selectedObject.properties?.access_type || 'Standard'}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
