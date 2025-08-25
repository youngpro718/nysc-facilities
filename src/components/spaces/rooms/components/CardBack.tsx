
import React, { useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Room } from "../types/RoomTypes";
import { EnhancedRoom } from "../types/EnhancedRoomTypes";
import { X, Building, Phone, ShoppingBag, Users, CircleAlert, Clipboard, Lightbulb, Clock, Key, Shield, AlertTriangle, History as HistoryIcon } from "lucide-react";
import { useRoomAccess } from "@/hooks/useRoomAccess";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, differenceInDays } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RoomInventory } from "../../RoomInventory";
import { ParentRoomHierarchy } from "../ParentRoomHierarchy";
import { LightingStatusWheel } from "@/components/spaces/LightingStatusWheel";
import { useNavigate } from "react-router-dom";
import { useCourtIssuesIntegration } from "@/hooks/useCourtIssuesIntegration";

interface CardBackProps {
  room: EnhancedRoom;
  onFlip: (e?: React.MouseEvent) => void;
}

export function CardBack({ room, onFlip }: CardBackProps) {
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const { data: roomAccess, isLoading: isAccessLoading } = useRoomAccess(room.id);
  const navigate = useNavigate();
  const { getIssuesForRoom, hasUrgentIssues, isLoading: isIssuesLoading } = useCourtIssuesIntegration();
  const unresolvedIssues = useMemo(() => getIssuesForRoom(room.id), [getIssuesForRoom, room.id]);
  const highSeverityCount = useMemo(
    () => unresolvedIssues.filter(i => ["urgent", "high", "critical"].includes((i.priority || "").toLowerCase())).length,
    [unresolvedIssues]
  );

  const totalLights = useMemo(() => room.total_fixtures_count ?? room.lighting_fixtures?.length ?? 0, [room]);
  const functionalLights = useMemo(() => room.functional_fixtures_count ?? room.lighting_fixtures?.filter(f => f.status === 'functional')?.length ?? 0, [room]);

  return (
    <div className="p-5 flex flex-col h-full bg-card border rounded-md shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground">
          Room Details
        </h3>
        <div className="flex items-center gap-2">
          {(isIssuesLoading || unresolvedIssues.length > 0) && (
            <Button
              variant={hasUrgentIssues(room.id) ? "destructive" : "outline"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                const params = new URLSearchParams({ tab: "issues", room_id: room.id });
                const buildingId = room.floor?.building?.id as string | undefined;
                if (buildingId) params.set("building", buildingId);
                navigate(`/operations?${params.toString()}`);
              }}
              title={hasUrgentIssues(room.id) ? `${highSeverityCount} urgent issues` : `${unresolvedIssues.length} open issues`}
            >
              <CircleAlert className="h-4 w-4 mr-1" />
              {hasUrgentIssues(room.id) ? `${highSeverityCount} Urgent` : `Issues ${unresolvedIssues.length}`}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onFlip}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
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
              {room.room_size_category && (
                <Badge variant="outline" className="text-xs capitalize">
                  Size: {room.room_size_category}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Enhanced History Overview with Visual Elements */}
          {room.history_stats && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <HistoryIcon className="h-3.5 w-3.5 text-muted-foreground" />
                Room History & Analytics
              </h4>
              <div className="rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground mb-1">{room.history_stats.total_issues}</div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Issues</p>
                    <div className="w-full bg-muted h-1 rounded-full mt-2">
                      <div 
                        className="h-1 rounded-full bg-red-400" 
                        style={{ width: `${Math.min(100, (room.history_stats.total_issues / 10) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground mb-1">{room.history_stats.unique_occupants}</div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">People Ever</p>
                    <div className="w-full bg-muted h-1 rounded-full mt-2">
                      <div 
                        className="h-1 rounded-full bg-blue-400" 
                        style={{ width: `${Math.min(100, (room.history_stats.unique_occupants / 5) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground mb-1">{room.history_stats.current_occupants}</div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Currently</p>
                    <div className="w-full bg-muted h-1 rounded-full mt-2">
                      <div 
                        className="h-1 rounded-full bg-green-400" 
                        style={{ width: `${Math.min(100, (room.history_stats.current_occupants / 3) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                {room.history_stats.last_issue_date && (
                  <div className="mt-3 pt-3 border-t border-muted text-center">
                    <p className="text-xs text-muted-foreground">
                      Last issue: <span className="font-medium">{format(new Date(room.history_stats.last_issue_date), 'MMM d, yyyy')}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
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
              
              {/* Enhanced Key Holders Display */}
              {roomAccess.key_holders.length > 0 && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-3 flex items-center justify-between">
                    Key Holders
                    <Badge variant="secondary" className="text-xs">
                      {roomAccess.key_holders.length} total
                    </Badge>
                  </p>
                  <div className="space-y-2">
                    {roomAccess.key_holders.slice(0, 4).map((holder, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-background/50 rounded-md">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {holder.first_name?.[0]}{holder.last_name?.[0]}
                            </span>
                          </div>
                          <span className="text-sm font-medium">{holder.first_name} {holder.last_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {holder.is_passkey && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              <Shield className="h-2.5 w-2.5 mr-1" />
                              Master
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{holder.key_name}</span>
                        </div>
                      </div>
                    ))}
                    {roomAccess.key_holders.length > 4 && (
                      <div className="text-center pt-2 border-t border-muted">
                        <p className="text-xs text-muted-foreground">
                          + {roomAccess.key_holders.length - 4} more key holders
                        </p>
                      </div>
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

          {/* Enhanced Occupants Information */}
          {room.current_occupants && room.current_occupants.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  Current Occupants
                </div>
                <Badge variant="secondary" className="text-xs">
                  {room.current_occupants.length} total
                </Badge>
              </h4>
              <div className="bg-muted/30 p-3 rounded-lg space-y-3">
                {room.current_occupants.map((occupant, index) => (
                  <div key={index} className="p-3 bg-background/50 rounded-md hover:bg-background/70 transition-colors">
                    <button
                      type="button"
                      className="w-full text-left"
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {occupant.first_name?.[0]}{occupant.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-sm hover:underline">
                              {occupant.first_name} {occupant.last_name}
                            </div>
                            {occupant.assignment_type && (
                              <div className="text-xs text-muted-foreground capitalize">
                                {occupant.assignment_type.replace(/_/g, ' ')}
                                {occupant.is_primary && ' • Primary'}
                              </div>
                            )}
                          </div>
                        </div>
                        {occupant.is_primary && (
                          <Badge variant="outline" className="text-xs">
                            Primary
                          </Badge>
                        )}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Enhanced Lighting Status Display */}
          {(totalLights > 0) && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
                Lighting System ({functionalLights}/{totalLights} functional)
              </h4>
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <LightingStatusWheel
                    functional={functionalLights}
                    total={totalLights}
                    size={48}
                    title={`${functionalLights}/${totalLights} lights functional`}
                    onClick={() => navigate(`/lighting?room=${encodeURIComponent(room.name ?? room.room_number ?? room.id)}`)}
                  />
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">
                      {Math.round((functionalLights / totalLights) * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Functional</div>
                  </div>
                </div>
                <div className="w-full bg-muted h-2 rounded-full">
                  <div 
                    className="h-2 rounded-full bg-primary transition-all duration-300" 
                    style={{ width: `${(functionalLights / totalLights) * 100}%` }}
                  />
                </div>
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

          {/* Courtroom capacity and accessibility removed per UI simplification */}

          {/* Detailed issue list removed; use Issues button in header and History stats above */}
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
