
import React, { useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Room } from "../types/RoomTypes";
import { EnhancedRoom } from "../types/EnhancedRoomTypes";
import { X, Building, Phone, ShoppingBag, Users, CircleAlert, Clipboard, Lightbulb, Clock, Accessibility, Key, Shield, AlertTriangle } from "lucide-react";
import { useRoomAccess } from "@/hooks/useRoomAccess";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, differenceInDays } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RoomInventory } from "../../RoomInventory";
import { ParentRoomHierarchy } from "../ParentRoomHierarchy";
import { LightingStatusWheel } from "@/components/spaces/LightingStatusWheel";
import { useNavigate } from "react-router-dom";

interface CardBackProps {
  room: EnhancedRoom;
  onFlip: (e?: React.MouseEvent) => void;
}

export function CardBack({ room, onFlip }: CardBackProps) {
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const { data: roomAccess, isLoading: isAccessLoading } = useRoomAccess(room.id);
  const navigate = useNavigate();

  const totalLights = useMemo(() => room.total_fixtures_count ?? room.lighting_fixtures?.length ?? 0, [room]);
  const functionalLights = useMemo(() => room.functional_fixtures_count ?? room.lighting_fixtures?.filter(f => f.status === 'functional')?.length ?? 0, [room]);

  return (
    <div className="p-5 flex flex-col h-full bg-card border rounded-md shadow-sm">
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
          
          {/* Room Hierarchy */}
          <div className="space-y-2">
            <ParentRoomHierarchy roomId={room.id} compact={false} />
          </div>
          
          {/* Type Information */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              Type Information
            </h4>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-xs capitalize">
                {typeof room.room_type === 'string' ? room.room_type.replace(/_/g, ' ') : ''}
              </Badge>
              {room.current_function && room.current_function !== room.room_type && (
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
          {room.is_storage && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                Storage Information
              </h4>
              <div className="text-sm text-muted-foreground space-y-1">
                {room.storage_type && <p>Type: {typeof room.storage_type === 'string' ? room.storage_type.replace(/_/g, ' ') : ''}</p>}
                {room.storage_capacity && <p>Capacity: {room.storage_capacity}</p>}
                {room.storage_notes && <p>Notes: {room.storage_notes}</p>}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full flex items-center justify-center"
                onClick={() => setIsInventoryDialogOpen(true)}
                title="View Inventory"
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Room Access Information */}
          {roomAccess && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Key className="h-3.5 w-3.5 text-muted-foreground" />
                Room Access
                {roomAccess.access_conflicts && roomAccess.access_conflicts.length > 0 && (
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 ml-1" />
                )}
              </h4>
              
              {/* Key Holders */}
              {roomAccess.key_holders.length > 0 && (
                <div className="bg-muted/50 p-2 rounded-md">
                  <p className="text-xs font-medium mb-2">Key Holders ({roomAccess.key_holders.length})</p>
                  <div className="space-y-1">
                    {roomAccess.key_holders.slice(0, 3).map((holder, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span>{holder.first_name} {holder.last_name}</span>
                        <div className="flex items-center gap-1">
                          {holder.is_passkey && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              <Shield className="h-2.5 w-2.5 mr-1" />
                              Master
                            </Badge>
                          )}
                          <span className="text-muted-foreground">{holder.key_name}</span>
                        </div>
                      </div>
                    ))}
                    {roomAccess.key_holders.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        + {roomAccess.key_holders.length - 3} more key holders
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Access Doors */}
              {roomAccess.access_doors.length > 0 && (
                <div className="bg-muted/50 p-2 rounded-md">
                  <p className="text-xs font-medium mb-2">Access Points</p>
                  <div className="space-y-1">
                    {roomAccess.access_doors.map((door, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span>{door.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {door.keys_count} key{door.keys_count !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Access Conflicts */}
              {roomAccess.access_conflicts && roomAccess.access_conflicts.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 p-2 rounded-md">
                  <p className="text-xs font-medium text-yellow-800 mb-1">Access Alerts</p>
                  {roomAccess.access_conflicts.map((conflict, index) => (
                    <p key={index} className="text-xs text-yellow-700">
                      {conflict.description}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Occupants Information */}
          {room.current_occupants && room.current_occupants.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Occupants ({room.current_occupants.length})
                {roomAccess?.current_occupancy && roomAccess.room_capacity && (
                  <Badge variant={roomAccess.current_occupancy > roomAccess.room_capacity ? "destructive" : "secondary"} className="text-xs ml-1">
                    {roomAccess.current_occupancy}/{roomAccess.room_capacity}
                  </Badge>
                )}
              </h4>
              <div className="space-y-2">
                {room.current_occupants.map((occupant, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    <button
                      type="button"
                      className="font-medium hover:underline"
                      title={`Open ${occupant.first_name} ${occupant.last_name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (occupant.id) {
                          navigate(`/occupants/${encodeURIComponent(occupant.id)}`);
                        } else {
                          const name = `${occupant.first_name ?? ''} ${occupant.last_name ?? ''}`.trim();
                          navigate(`/occupants?search=${encodeURIComponent(name)}`);
                        }
                      }}
                    >
                      {occupant.first_name} {occupant.last_name}
                    </button>
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
          
          {/* Lighting Fixture Details */}
          {(totalLights > 0) && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
                Lighting Status ({functionalLights}/{totalLights})
              </h4>
              <div className="flex items-center gap-2">
                <LightingStatusWheel
                  functional={functionalLights}
                  total={totalLights}
                  size={28}
                  title={`${functionalLights}/${totalLights} lights functional`}
                  onClick={() => navigate(`/lighting?room=${encodeURIComponent(room.name ?? room.room_number ?? room.id)}`)}
                />
                <span className="text-xs text-muted-foreground">Lighting</span>
              </div>
              <div className="space-y-2">
                {(room.lighting_fixtures ?? []).filter(f => f.status !== 'functional').map((fixture, index) => (
                  <button
                    key={fixture.id || index}
                    type="button"
                    className="text-xs bg-amber-50 border border-amber-200 text-amber-700 p-2 rounded-md w-full text-left hover:bg-amber-100"
                    title={`Open fixture ${fixture.location ?? fixture.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const base = `/lighting?room=${encodeURIComponent(room.name ?? room.room_number ?? room.id)}&status=out`;
                      const url = fixture.id ? `${base}&fixtureId=${encodeURIComponent(fixture.id)}` : base;
                      navigate(url);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant={fixture.status === 'flickering' ? 'secondary' : 'destructive'} className="text-[10px]">
                          {fixture.status}
                        </Badge>
                        <span className="font-medium">{fixture.location ?? fixture.id}</span>
                      </div>
                      {fixture.outage_duration_days && fixture.outage_duration_days > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {fixture.outage_duration_days}d out
                        </div>
                      )}
                    </div>
                    {fixture.ballast_issue && (
                      <p className="text-[10px] text-orange-600 mt-1">⚠ Ballast issue detected</p>
                    )}
                  </button>
                ))}
                {/* Fallback: show a generic chip if we know there are non-functional lights but we don't have a detailed fixtures list */}
                {((room.lighting_fixtures ?? []).filter(f => f.status !== 'functional').length === 0)
                  && (totalLights > functionalLights) && (
                  <button
                    type="button"
                    className="text-xs bg-amber-50 border border-amber-200 text-amber-700 p-2 rounded-md w-full text-left hover:bg-amber-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/lighting?room=${encodeURIComponent(room.name ?? room.room_number ?? room.id)}&status=out`);
                    }}
                  >
                    View {totalLights - functionalLights} lights out
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Courtroom Capacity Details */}
          {room.room_type === 'courtroom' && room.court_room && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Courtroom Capacity
              </h4>
              <div className="space-y-2">
                <div className="text-sm bg-muted/50 p-2 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Juror Capacity:</span>
                      <p className="text-lg font-bold text-primary">{room.court_room.juror_capacity}</p>
                    </div>
                    <div>
                      <span className="font-medium">Spectator Capacity:</span>
                      <p className="text-lg font-bold text-primary">{room.court_room.spectator_capacity}</p>
                    </div>
                  </div>
                  
                  {/* Accessibility Features */}
                  <div className="mt-3 pt-2 border-t">
                    <span className="text-xs font-medium text-muted-foreground">Accessibility:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {room.court_room.accessibility_features.wheelchair_accessible && (
                        <Badge variant="outline" className="text-xs">
                          <Accessibility className="h-3 w-3 mr-1" />
                          Wheelchair Access
                        </Badge>
                      )}
                      {room.court_room.accessibility_features.hearing_assistance && (
                        <Badge variant="outline" className="text-xs">Hearing Assistance</Badge>
                      )}
                      {room.court_room.accessibility_features.visual_aids && (
                        <Badge variant="outline" className="text-xs">Visual Aids</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Issue History (if any) */}
          {room.issues && room.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <CircleAlert className="h-3.5 w-3.5 text-muted-foreground" />
                Recent Issues ({room.issues.length})
                {room.has_persistent_issues && (
                  <Badge variant="destructive" className="text-xs ml-2">
                    Recurring
                  </Badge>
                )}
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
                    {issue.location && (
                      <p className="text-xs text-muted-foreground mt-1">Location: {issue.location}</p>
                    )}
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
        </div>
      </ScrollArea>
      
      {/* Inventory Dialog */}
      {room.is_storage && (
        <Dialog open={isInventoryDialogOpen} onOpenChange={setIsInventoryDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Inventory for {room.name}</DialogTitle>
            </DialogHeader>
            <div className="h-[calc(90vh-8rem)] overflow-hidden">
              <RoomInventory roomId={room.id} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
