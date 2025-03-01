
import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Edit2, Hash, LayoutDashboard, Users, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditPropertiesPanel } from "./EditPropertiesPanel";

interface PropertiesPanelProps {
  selectedObject: any | null;
  onUpdate?: () => void;
  onPreviewChange?: (previewData: any) => void;
}

export function PropertiesPanel({ selectedObject, onUpdate, onPreviewChange }: PropertiesPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const handlePreview = useCallback((values: any) => {
    if (onPreviewChange && selectedObject) {
      const previewData = {
        id: selectedObject.id,
        type: selectedObject.type,
        position: { 
          x: Number(values.positionX), 
          y: Number(values.positionY) 
        },
        rotation: Number(values.rotation),
        data: {
          ...selectedObject.data,
          label: values.label,
          size: { 
            width: Number(values.width), 
            height: Number(values.height) 
          },
          properties: {
            ...selectedObject.properties,
            room_number: values.room_number,
            room_type: values.room_type,
            status: values.status
          }
        }
      };
      
      onPreviewChange(previewData);
    }
  }, [selectedObject, onPreviewChange]);

  if (!selectedObject) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          Select an object to view and edit its properties
        </p>
      </Card>
    );
  }

  if (isEditing) {
    return (
      <Card className="p-4">
        <EditPropertiesPanel
          selectedObject={selectedObject}
          onClose={() => setIsEditing(false)}
          onUpdate={() => {
            if (onUpdate) onUpdate();
            setIsEditing(false);
          }}
          onPreview={handlePreview}
        />
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'under_maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'left_of_hallway':
        return <ArrowLeft className="h-4 w-4 text-muted-foreground" />;
      case 'right_of_hallway':
        return <ArrowRight className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <Card className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Properties</h3>
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
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

          {selectedObject.properties?.direction && (
            <div className="flex items-center gap-2 text-sm">
              {getDirectionIcon(selectedObject.properties.direction)}
              <span className="font-medium">Position:</span>
              <span className="capitalize">
                {selectedObject.properties.direction.replace(/_/g, ' ')}
              </span>
              {selectedObject.properties.hallway_position && (
                <span className="text-muted-foreground">
                  (Position: {Math.round(selectedObject.properties.hallway_position * 100)}%)
                </span>
              )}
            </div>
          )}

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

        {/* Position & Size */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Position & Size</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Position:</span>{' '}
              ({Math.round(selectedObject.position?.x || 0)}, {Math.round(selectedObject.position?.y || 0)})
            </div>
            <div>
              <span className="text-muted-foreground">Size:</span>{' '}
              {selectedObject.size?.width || 0}x{selectedObject.size?.height || 0}
            </div>
            {selectedObject.rotation !== undefined && (
              <div>
                <span className="text-muted-foreground">Rotation:</span>{' '}
                {Math.round(selectedObject.rotation)}°
              </div>
            )}
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
