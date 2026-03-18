import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Users, 
  AlertTriangle, 
  Calendar,
  Edit,
  Trash2,
  Info,
  Building,
  Layers,
  Home,
  Activity
} from "lucide-react";
import { Room } from "../rooms/types/RoomTypes";

interface RoomDetailPanelProps {
  room: Room | null;
  onEdit?: (room: Room) => void;
  onDelete?: (roomId: string) => void;
}

export function RoomDetailPanel({ room, onEdit, onDelete }: RoomDetailPanelProps) {
  if (!room) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <Home className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Room Selected</h3>
          <p className="text-muted-foreground">
            Select a room from the list below to view detailed information
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'under_maintenance':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Activity className="h-3 w-3" />;
      case 'under_maintenance':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl">{room.room_number}</CardTitle>
              <Badge variant={getStatusColor(room.status)} className="flex items-center gap-1">
                {getStatusIcon(room.status)}
                {room.status.replace('_', ' ')}
              </Badge>
            </div>
            <h3 className="text-lg text-muted-foreground">{room.name}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                {room.floor?.building?.name || 'Unknown Building'}
              </div>
              <div className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                {room.floor?.name || 'Unknown Floor'}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(room)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(room.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Type</h4>
            <Badge variant="outline" className="w-fit">
              {room.room_type || 'Unspecified'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Storage</h4>
            <div className="flex items-center gap-1 text-sm">
              <MapPin className="h-4 w-4" />
              {room.storage_type || 'Not a storage room'}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Phone</h4>
            <div className="flex items-center gap-1 text-sm">
              <Users className="h-4 w-4" />
              {room.phone_number || 'Not specified'}
            </div>
          </div>
        </div>

        <Separator />

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{room.current_occupants?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Occupants</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{room.issues?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Issues</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{room.lighting_fixture ? 1 : 0}</div>
            <div className="text-sm text-muted-foreground">Fixtures</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{room.room_history?.length || 0}</div>
            <div className="text-sm text-muted-foreground">History</div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Issues */}
          {room.issues && room.issues.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Recent Issues
              </h4>
              <div className="space-y-2">
                {room.issues.slice(0, 3).map((issue: any) => (
                  <div key={issue.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="font-medium text-sm">{issue.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {issue.status} • {new Date(issue.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Occupants */}
          {room.current_occupants && room.current_occupants.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Current Occupants
              </h4>
              <div className="space-y-2">
                {room.current_occupants.slice(0, 3).map((occupant: any, index: number) => (
                  <div key={occupant.id || index} className="p-3 bg-muted/50 rounded-lg">
                    <div className="font-medium text-sm">{occupant.personnel_name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">
                      {occupant.role || 'Unknown role'} • {occupant.department || 'Unknown dept'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {room.description && (
          <div className="space-y-2">
            <h4 className="font-medium">Description</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {room.description}
            </p>
          </div>
        )}

        {/* Timestamps */}
        <div className="pt-4 border-t text-xs text-muted-foreground flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Created: {new Date(room.created_at).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Updated: {new Date(room.updated_at).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}