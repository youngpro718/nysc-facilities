
import React, { useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnhancedRoom } from "../types/EnhancedRoomTypes";
import { X, Building, Phone, ShoppingBag, Users, Clipboard, Lightbulb, Shield, AlertTriangle, History as HistoryIcon, StickyNote, Layers, Ticket, Plus } from "lucide-react";
import { useRoomAccess } from "@/hooks/useRoomAccess";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog } from "@/components/ui/dialog";
import { RoomInventory } from "../../RoomInventory";
import { ParentRoomHierarchy } from "../ParentRoomHierarchy";
import { LightingStatusWheel } from "@/components/spaces/LightingStatusWheel";
import { useNavigate } from "react-router-dom";
import { useCourtIssuesIntegration } from "@/hooks/useCourtIssuesIntegration";
import { RoomHistoryTimeline } from "./history/RoomHistoryTimeline";
import { RoomLightingManager } from "./lighting/RoomLightingManager";
import { RoomNotesPanel } from "./notes/RoomNotesPanel";
import { useChildRooms } from "@/hooks/useChildRooms";
import { useLightingWithTickets } from "@/hooks/useLightingWithTickets";

interface CardBackProps {
  room: EnhancedRoom;
  onFlip: (e?: React.MouseEvent) => void;
}

export function CardBack({ room, onFlip }: CardBackProps) {
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'access' | 'lighting' | 'notes' | 'history'>('info');
  const { data: roomAccess, isLoading: isAccessLoading } = useRoomAccess(room.id);
  const { data: childRooms = [] } = useChildRooms(room.id);
  const { data: lightingWithTickets = [] } = useLightingWithTickets(room.id);
  const navigate = useNavigate();
  const { getIssuesForRoom } = useCourtIssuesIntegration();

  const totalLights = useMemo(() => room.total_fixtures_count ?? room.lighting_fixtures?.length ?? 0, [room]);
  const functionalLights = useMemo(() => room.functional_fixtures_count ?? room.lighting_fixtures?.filter(f => f.status === 'functional')?.length ?? 0, [room]);

  const nonFunctionalFixtures = lightingWithTickets.filter(f => f.status !== 'functional');
  const fixturesWithoutTickets = nonFunctionalFixtures.filter(f => !f.issue_id);

  return (
    <div className="p-5 flex flex-col h-full bg-card border rounded-md shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {room.name}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onFlip}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-4 p-1 bg-muted/50 rounded-lg overflow-x-auto">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeTab === 'info' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building className="h-3.5 w-3.5 inline mr-1" />
          Info
        </button>
        <button
          onClick={() => setActiveTab('access')}
          className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeTab === 'access' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="h-3.5 w-3.5 inline mr-1" />
          Access
        </button>
        <button
          onClick={() => setActiveTab('lighting')}
          className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeTab === 'lighting' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Lightbulb className="h-3.5 w-3.5 inline mr-1" />
          Lights
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeTab === 'notes' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <StickyNote className="h-3.5 w-3.5 inline mr-1" />
          Notes
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeTab === 'history' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <HistoryIcon className="h-3.5 w-3.5 inline mr-1" />
          History
        </button>
      </div>
      
      <ScrollArea className="flex-1 pr-2">
        {/* Info Tab */}
        {activeTab === 'info' && (
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

            {/* Child Rooms */}
            {childRooms.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  Sub-Rooms ({childRooms.length})
                </h4>
                <div className="bg-muted/30 p-2 rounded-lg space-y-1">
                  {childRooms.map((child) => (
                    <div key={child.id} className="flex items-center justify-between p-2 bg-background/50 rounded-md text-xs">
                      <span className="font-medium">{child.name}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {child.room_type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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

            {/* Storage Information */}
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
                  <Clipboard className="h-4 w-4 mr-2" />
                  View Inventory
                </Button>
              </div>
            )}

            {/* Enhanced Occupants Information */}
            {room.current_occupants && room.current_occupants.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    Current Occupants
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {room.current_occupants.length} total
                  </Badge>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg space-y-3">
                  {room.current_occupants.map((occupant, index) => (
                    <div key={index} className="p-3 bg-background/50 rounded-md hover:bg-background/70 transition-colors">
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (occupant.id) {
                            navigate(`/occupants/${encodeURIComponent(occupant.id)}`);
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
          </div>
        )}

        {/* Access Tab */}
        {activeTab === 'access' && roomAccess && (
          <div className="space-y-4">
            {/* Enhanced Key Holders Display */}
            {roomAccess.key_holders.length > 0 && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm font-medium mb-3 flex items-center justify-between">
                  <span>Key Holders</span>
                  <Badge variant="secondary" className="text-xs">
                    {roomAccess.key_holders.length} total
                  </Badge>
                </div>
                <div className="space-y-2">
                  {roomAccess.key_holders.map((holder, index) => (
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

        {/* Lighting Tab */}
        {activeTab === 'lighting' && totalLights > 0 && (
          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <RoomLightingManager
                  room={room}
                  trigger={
                    <LightingStatusWheel
                      functional={functionalLights}
                      total={totalLights}
                      size={48}
                      title={`${functionalLights}/${totalLights} lights functional - Click to manage`}
                      onClick={() => {}}
                    />
                  }
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

            {/* Warning for fixtures without tickets */}
            {fixturesWithoutTickets.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 p-2 rounded-md">
                <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="font-medium">{fixturesWithoutTickets.length} fixture(s) have no ticket submitted</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {nonFunctionalFixtures.map((fixture) => (
                <div
                  key={fixture.id}
                  className="text-xs bg-card border border-border p-3 rounded-md"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={fixture.status === 'flickering' ? 'secondary' : 'destructive'} className="text-[10px]">
                        {fixture.status}
                      </Badge>
                      <span className="font-medium">{fixture.position || fixture.name}</span>
                    </div>
                    {fixture.outage_duration_days && fixture.outage_duration_days > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <AlertTriangle className="h-3 w-3" />
                        Out {fixture.outage_duration_days}d
                      </div>
                    )}
                  </div>
                  {/* Ticket Status */}
                  {fixture.ticket ? (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-[10px]">
                      <Ticket className="h-3 w-3 text-primary" />
                      <span className="font-medium">Ticket: {fixture.ticket.status}</span>
                      <span className="text-muted-foreground">• Submitted {fixture.ticket.days_since_submitted}d ago</span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-[10px] text-amber-600 border-amber-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/operations?tab=issues&create=true&room_id=${room.id}&title=Lighting%20Issue%20-%20${encodeURIComponent(fixture.name)}`);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create Ticket
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            <RoomNotesPanel roomId={room.id} compact={false} />
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <HistoryIcon className="h-3.5 w-3.5 text-muted-foreground" />
              Room History & Resolution Timeline
            </h4>
            <div className="rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10 p-4">
              <RoomHistoryTimeline room={room} />
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Inventory Dialog */}
      {isInventoryDialogOpen && (
        <RoomInventory roomId={room.id} />
      )}
    </div>
  );
}
