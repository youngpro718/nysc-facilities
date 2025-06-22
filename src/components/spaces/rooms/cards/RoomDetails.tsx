
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Room, CourtroomPhotos } from "../../types/RoomTypes";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar, Settings } from "lucide-react";
import { CourtroomPhotos as CourtroomPhotosComponent } from "../components/CourtroomPhotos";

interface RoomDetailsProps {
  room: Room;
}

export function RoomDetails({ room }: RoomDetailsProps) {
  const handlePhotosUpdate = (photos: CourtroomPhotos) => {
    // Handle photo updates - this could trigger a mutation to update the room
    console.log('Photos updated:', photos);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Room Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Room Number</p>
              <p className="font-medium">{room.room_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <Badge variant="secondary" className="capitalize">
                {room.room_type?.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge 
                variant={room.status === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {room.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Floor</p>
              <p className="font-medium">
                {room.floor?.name} - {room.floor?.building?.name}
              </p>
            </div>
          </div>

          {room.description && (
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-sm">{room.description}</p>
            </div>
          )}

          {room.capacity && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Capacity: {room.capacity}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Created: {new Date(room.created_at).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>

      {room.room_type === 'courtroom' && (
        <CourtroomPhotosComponent 
          room={room} 
          onUpdate={handlePhotosUpdate}
        />
      )}

      {room.issues && room.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Active Issues ({room.issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {room.issues.map((issue) => (
                <div key={issue.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium text-sm">{issue.title}</p>
                    <p className="text-xs text-muted-foreground">{issue.type}</p>
                  </div>
                  <Badge 
                    variant={issue.priority === 'high' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {issue.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
