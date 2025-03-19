
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Room } from "../types/RoomTypes";
import { X, Calendar, Clock, Building, Phone, ShoppingBag, Users, Key, Clipboard, CircleAlert } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface CardBackProps {
  room: Room;
  onFlip: () => void;
}

export function CardBack({ room, onFlip }: CardBackProps) {
  return (
    <div className="p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground">
          Room Details
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onFlip}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="h-[calc(100%-2rem)] pr-2">
        <div className="space-y-4">
          {/* Room Location */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Building className="h-3.5 w-3.5 text-muted-foreground" />
              Location
            </h4>
            <div className="text-sm text-muted-foreground">
              <p>Room {room.room_number}</p>
              <p>{room.floor?.building?.name}, Floor {room.floor?.name}</p>
            </div>
          </div>
          
          {/* Type Information */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Clipboard className="h-3.5 w-3.5 text-muted-foreground" />
              Type Information
            </h4>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-xs capitalize">
                {room.room_type.replace(/_/g, ' ')}
              </Badge>
              {room.current_function && (
                <Badge variant="outline" className="text-xs capitalize">
                  {room.current_function.replace(/_/g, ' ')}
                </Badge>
              )}
              {room.is_storage && (
                <Badge variant="outline" className="text-xs">
                  Storage
                </Badge>
              )}
            </div>
          </div>
          
          {/* Contact Information */}
          {room.phone_number && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Contact
              </h4>
              <p className="text-sm text-muted-foreground">
                {room.phone_number}
              </p>
            </div>
          )}

          {/* Storage Information (if storage room) */}
          {room.is_storage && room.storage_type && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                Storage Information
              </h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Type: {room.storage_type.replace(/_/g, ' ')}</p>
                {room.storage_capacity && <p>Capacity: {room.storage_capacity}</p>}
                {room.storage_notes && <p>Notes: {room.storage_notes}</p>}
              </div>
            </div>
          )}
          
          {/* Occupants Information */}
          {room.current_occupants && room.current_occupants.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Occupants ({room.current_occupants.length})
              </h4>
              <div className="space-y-2">
                {room.current_occupants.map((occupant, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    <p className="font-medium">
                      {occupant.first_name} {occupant.last_name}
                    </p>
                    {occupant.assignment_type && (
                      <p className="text-xs capitalize">
                        {occupant.assignment_type.replace(/_/g, ' ')}
                        {occupant.is_primary && ' (Primary)'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Key Access - Removing since it's not in the Room type */}
          
          {/* Issue History (if any) */}
          {room.issues && room.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <CircleAlert className="h-3.5 w-3.5 text-muted-foreground" />
                Recent Issues ({room.issues.length})
              </h4>
              <div className="space-y-2">
                {room.issues.slice(0, 3).map((issue, index) => (
                  <div key={index} className="text-sm bg-muted/50 p-2 rounded-md">
                    <div className="flex justify-between">
                      <Badge variant={
                        issue.status === 'open' ? 'default' :
                        issue.status === 'in_progress' ? 'secondary' :
                        issue.status === 'resolved' ? 'outline' : 'destructive'
                      } className="text-xs">
                        {issue.status.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(issue.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2">{issue.description}</p>
                  </div>
                ))}
                {room.issues.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    + {room.issues.length - 3} more issues
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Activity History - Removing since it's not in the Room type */}
          
          {/* Schedule - Removing since it's not in the Room type */}
        </div>
      </ScrollArea>
    </div>
  );
}
