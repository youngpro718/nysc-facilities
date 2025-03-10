import { Room } from "../types/RoomTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building, Lightbulb, ArrowLeftRight, Info, Phone, Users, Clock, Calendar, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface CardBackProps {
  room: Room;
  onFlip: () => void;
}

export function CardBack({ room, onFlip }: CardBackProps) {
  return (
    <Card className="absolute w-full h-full backface-hidden rotate-y-180 bg-card overflow-hidden">
      <CardHeader className="flex-none p-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5" />
          {room.name} Details
        </CardTitle>
      </CardHeader>
      <ScrollArea className="h-[calc(100%-5rem)] px-4">
        <div className="space-y-4 pb-6">
          {/* Basic Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Building className="h-4 w-4" />
              Location Information
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                <strong>Room Number:</strong> {room.room_number}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Floor:</strong> {room.floor?.name || 'Unknown'}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Building:</strong> {room.floor?.building?.name || 'Unknown'}
              </p>
              {room.phone_number && (
                <div className="flex items-center gap-1 mt-2">
                  <Phone className="h-3 w-3" />
                  <p className="text-sm text-muted-foreground">{room.phone_number}</p>
                </div>
              )}
            </div>
          </div>

          {/* Current Function */}
          {room.current_function && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Current Function
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  {room.current_function}
                </p>
                {room.function_change_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Since {format(new Date(room.function_change_date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Storage Information */}
          {room.is_storage && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Database className="h-4 w-4" />
                Storage Information
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  <strong>Type:</strong> {room.storage_type || 'General Storage'}
                </p>
                {room.storage_capacity && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Capacity:</strong> {room.storage_capacity} units
                  </p>
                )}
                {room.storage_notes && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {room.storage_notes}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Connected Spaces */}
          {room.space_connections && room.space_connections.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ArrowLeftRight className="h-4 w-4" />
                Connected Spaces
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="space-y-2">
                  {room.space_connections.map(conn => (
                    <div key={conn.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {conn.connection_type}
                        </Badge>
                        <span className="text-sm">
                          {conn.to_space?.name || `Space ${conn.to_space_id.substring(0, 6)}`}
                        </span>
                      </div>
                      {conn.direction && (
                        <Badge variant="secondary" className="text-xs">
                          {conn.direction}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Lighting Information */}
          {room.lighting_fixture && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lightbulb className="h-4 w-4" />
                Lighting Information
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  <strong>Status:</strong> {room.lighting_fixture.status}
                </p>
                {room.lighting_fixture.technology && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Technology:</strong> {room.lighting_fixture.technology}
                  </p>
                )}
                {room.lighting_fixture.electrical_issues && Object.keys(room.lighting_fixture.electrical_issues).length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Issues:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(room.lighting_fixture.electrical_issues).map(([key, value]) => (
                        value && (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key.replace(/_/g, ' ')}
                          </Badge>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Occupants */}
          {room.current_occupants && room.current_occupants.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                Current Occupants
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="space-y-2">
                  {room.current_occupants.map((occupant, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      {occupant.first_name} {occupant.last_name}
                      {occupant.title && <span className="text-xs"> - {occupant.title}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Room History */}
          {room.room_history && room.room_history.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Room History
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="space-y-2">
                  {room.room_history.slice(0, 3).map((history, index) => (
                    <div key={index} className="text-xs text-muted-foreground">
                      <span className="font-medium">
                        {format(new Date(history.created_at), 'MMM d, yyyy')}:
                      </span>
                      <span> {history.change_type} </span>
                      {history.new_values && 
                        <span className="italic">{JSON.stringify(history.new_values).substring(0, 30)}...</span>
                      }
                    </div>
                  ))}
                  {room.room_history.length > 3 && (
                    <p className="text-xs text-muted-foreground italic">
                      + {room.room_history.length - 3} more history entries
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
        <Button onClick={onFlip} className="w-full" variant="secondary">
          Return to Front
        </Button>
      </div>
    </Card>
  );
}
