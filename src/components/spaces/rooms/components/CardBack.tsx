import React, { useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnhancedRoom } from "../types/EnhancedRoomTypes";
import { X, Building, Phone, ShoppingBag, Users, Clipboard, Lightbulb, AlertTriangle, History as HistoryIcon, StickyNote, Ticket, Plus, Camera, CheckCircle, Zap } from "lucide-react";
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
import { useLightingWithTickets } from "@/hooks/useLightingWithTickets";

interface CardBackProps {
  room: EnhancedRoom;
  onFlip: (e?: React.MouseEvent) => void;
}

export function CardBack({ room, onFlip }: CardBackProps) {
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'issues' | 'lighting' | 'notes' | 'history'>('info');
  const { data: lightingWithTickets = [] } = useLightingWithTickets(room.id);
  
  // Courtroom photos
  const isCourtroom = room.room_type === 'courtroom';
  const courtroomPhotos = room.courtroom_photos;
  const hasPhotos = courtroomPhotos && (courtroomPhotos.judge_view || courtroomPhotos.audience_view);
  const navigate = useNavigate();
  const { getIssuesForRoom } = useCourtIssuesIntegration();
  const unresolvedIssues = getIssuesForRoom(room.id);
  const highPriorityIssues = unresolvedIssues.filter(i => ["urgent", "high", "critical"].includes((i.priority || "").toLowerCase()));
  const mediumPriorityIssues = unresolvedIssues.filter(i => (i.priority || "").toLowerCase() === "medium");
  const lowPriorityIssues = unresolvedIssues.filter(i => !["urgent", "high", "critical", "medium"].includes((i.priority || "").toLowerCase()));

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
          onClick={() => setActiveTab('issues')}
          className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeTab === 'issues' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
          Issues
          {unresolvedIssues.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
              {unresolvedIssues.length}
            </span>
          )}
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
            {/* Courtroom Photos - Prominent Display */}
            {isCourtroom && hasPhotos && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                  Courtroom Photos
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {courtroomPhotos?.judge_view && (() => {
                    const photos = Array.isArray(courtroomPhotos.judge_view) 
                      ? courtroomPhotos.judge_view 
                      : [courtroomPhotos.judge_view];
                    const firstPhoto = photos[0];
                    return firstPhoto ? (
                      <div className="space-y-1">
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                          <img 
                            src={firstPhoto} 
                            alt="Judge View" 
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(firstPhoto, '_blank')}
                          />
                          {photos.length > 1 && (
                            <div className="absolute top-1 right-1 bg-background/80 px-1.5 py-0.5 rounded text-xs">
                              +{photos.length - 1}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground text-center">Judge View ({photos.length})</p>
                      </div>
                    ) : null;
                  })()}
                  {courtroomPhotos?.audience_view && (() => {
                    const photos = Array.isArray(courtroomPhotos.audience_view) 
                      ? courtroomPhotos.audience_view 
                      : [courtroomPhotos.audience_view];
                    const firstPhoto = photos[0];
                    return firstPhoto ? (
                      <div className="space-y-1">
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                          <img 
                            src={firstPhoto} 
                            alt="Audience View" 
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(firstPhoto, '_blank')}
                          />
                          {photos.length > 1 && (
                            <div className="absolute top-1 right-1 bg-background/80 px-1.5 py-0.5 rounded text-xs">
                              +{photos.length - 1}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground text-center">Audience View ({photos.length})</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            )}

            {/* Courtroom Layout/Setup Details */}
            {isCourtroom && (room as any).court_room?.layout_details && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-muted-foreground" />
                  Courtroom Setup
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* Defense Table */}
                  {(room as any).court_room?.layout_details?.defense_table && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Defense Table</p>
                      <div className="text-sm space-y-0.5">
                        {(room as any).court_room.layout_details.defense_table.length_in && 
                         (room as any).court_room.layout_details.defense_table.depth_in && (
                          <p>{(room as any).court_room.layout_details.defense_table.length_in}" × {(room as any).court_room.layout_details.defense_table.depth_in}"</p>
                        )}
                        {(room as any).court_room.layout_details.defense_table.seats && (
                          <p className="text-muted-foreground">{(room as any).court_room.layout_details.defense_table.seats} seats</p>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Prosecution Table */}
                  {(room as any).court_room?.layout_details?.prosecution_table && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Prosecution Table</p>
                      <div className="text-sm space-y-0.5">
                        {(room as any).court_room.layout_details.prosecution_table.length_in && 
                         (room as any).court_room.layout_details.prosecution_table.depth_in && (
                          <p>{(room as any).court_room.layout_details.prosecution_table.length_in}" × {(room as any).court_room.layout_details.prosecution_table.depth_in}"</p>
                        )}
                        {(room as any).court_room.layout_details.prosecution_table.seats && (
                          <p className="text-muted-foreground">{(room as any).court_room.layout_details.prosecution_table.seats} seats</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {(room as any).court_room?.layout_details?.notes && (
                  <p className="text-xs text-muted-foreground">{(room as any).court_room.layout_details.notes}</p>
                )}
              </div>
            )}

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
            
            {/* Room Hierarchy - show parent chain and child rooms */}
            <div className="space-y-2">
              <ParentRoomHierarchy roomId={room.id} showChildren={true} compact={false} />
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
                  {room.current_occupants.map((occupant: any, index: number) => (
                    <div key={index} className="p-3 bg-background/50 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {occupant.first_name?.[0]}{occupant.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">
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
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Issues Tab */}
        {activeTab === 'issues' && (
          <div className="space-y-4">
            {unresolvedIssues.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500/60" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">No open issues</p>
                <p className="text-xs text-muted-foreground mb-3">This room has no unresolved issues</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/operations?tab=issues&create=true&room_id=${room.id}&title=Issue%20in%20${encodeURIComponent(room.name)}`);
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Report Issue
                </Button>
              </div>
            ) : (
              <>
                {/* Priority Summary */}
                <div className="grid grid-cols-3 gap-2">
                  <div className={`text-center p-2.5 rounded-lg border ${
                    highPriorityIssues.length > 0
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                      : 'bg-muted/30 border-border'
                  }`}>
                    <div className={`text-xl font-bold ${highPriorityIssues.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                      {highPriorityIssues.length}
                    </div>
                    <div className="text-xs text-muted-foreground">High</div>
                  </div>
                  <div className={`text-center p-2.5 rounded-lg border ${
                    mediumPriorityIssues.length > 0
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                      : 'bg-muted/30 border-border'
                  }`}>
                    <div className={`text-xl font-bold ${mediumPriorityIssues.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                      {mediumPriorityIssues.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Medium</div>
                  </div>
                  <div className={`text-center p-2.5 rounded-lg border ${
                    lowPriorityIssues.length > 0
                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                      : 'bg-muted/30 border-border'
                  }`}>
                    <div className={`text-xl font-bold ${lowPriorityIssues.length > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                      {lowPriorityIssues.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Low</div>
                  </div>
                </div>

                {/* Issue List */}
                <div className="space-y-2">
                  {unresolvedIssues.map((issue) => {
                    const priorityColor = ["urgent", "high", "critical"].includes((issue.priority || "").toLowerCase())
                      ? 'border-l-red-500'
                      : (issue.priority || "").toLowerCase() === "medium"
                        ? 'border-l-amber-500'
                        : 'border-l-blue-500';
                    return (
                      <div
                        key={issue.id}
                        className={`bg-card border border-border border-l-[3px] ${priorityColor} p-3 rounded-md cursor-pointer hover:bg-muted/50 transition-colors`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/operations?tab=issues&issue=${issue.id}`);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-sm font-medium leading-tight line-clamp-2">{issue.title}</span>
                          <Badge
                            variant={issue.status === 'open' ? 'destructive' : 'secondary'}
                            className="text-xs shrink-0 capitalize"
                          >
                            {(issue.status || 'open').replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs capitalize">
                            {(issue.priority || 'low').replace(/_/g, ' ')}
                          </Badge>
                          {issue.created_at && (
                            <span>{Math.floor((Date.now() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24))}d ago</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Report New Issue */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/operations?tab=issues&create=true&room_id=${room.id}&title=Issue%20in%20${encodeURIComponent(room.name)}`);
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Report New Issue
                </Button>
              </>
            )}
          </div>
        )}

        {/* Lighting Tab */}
        {activeTab === 'lighting' && (
          <div className="space-y-4">
            {/* Empty state when no fixtures */}
            {totalLights === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground mb-1">No fixtures configured</p>
                <p className="text-xs text-muted-foreground/70 mb-3">Add lighting fixtures to track their status</p>
                <RoomLightingManager
                  room={room}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Configure Lighting
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                {/* Summary Header */}
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
                        {functionalLights}/{totalLights}
                      </div>
                      <div className="text-xs text-muted-foreground">Functional</div>
                    </div>
                  </div>
                  {(() => {
                    const pct = Math.round((functionalLights / totalLights) * 100);
                    const barColor = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                    return (
                      <div className="w-full bg-muted h-2 rounded-full">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    );
                  })()}
                </div>

                {/* Warning for fixtures without tickets */}
                {fixturesWithoutTickets.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 p-2.5 rounded-md">
                    <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-medium">{fixturesWithoutTickets.length} fixture(s) need a ticket</span>
                    </div>
                  </div>
                )}

                {/* All Clear state */}
                {nonFunctionalFixtures.length === 0 && (
                  <div className="text-center py-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="h-6 w-6 mx-auto mb-1.5 text-green-500" />
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">All lights functional</p>
                    <p className="text-xs text-green-600/70 dark:text-green-500/70 mt-0.5">{totalLights} fixture{totalLights !== 1 ? 's' : ''} operating normally</p>
                  </div>
                )}

                {/* Non-functional fixture list */}
                {nonFunctionalFixtures.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {nonFunctionalFixtures.length} fixture{nonFunctionalFixtures.length !== 1 ? 's' : ''} need attention
                    </p>
                    {nonFunctionalFixtures.map((fixture) => (
                      <div
                        key={fixture.id}
                        className="bg-card border border-border p-3 rounded-md"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={fixture.status === 'flickering' ? 'secondary' : 'destructive'} className="text-xs capitalize">
                              {fixture.status.replace(/_/g, ' ')}
                            </Badge>
                            <span className="text-sm font-medium">{fixture.position || fixture.name}</span>
                          </div>
                          {fixture.outage_duration_days != null && fixture.outage_duration_days > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <AlertTriangle className="h-3 w-3" />
                              {fixture.outage_duration_days}d
                            </div>
                          )}
                        </div>
                        {fixture.ballast_issue && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mb-2">
                            <Zap className="h-3 w-3" />
                            <span>Ballast issue — requires electrician</span>
                          </div>
                        )}
                        {/* Ticket Status */}
                        {fixture.ticket ? (
                          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
                            <Ticket className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="font-medium capitalize">{fixture.ticket.status}</span>
                            <span className="text-muted-foreground">• {fixture.ticket.days_since_submitted}d ago</span>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/operations?tab=issues&create=true&room_id=${room.id}&title=Lighting%20Issue%20-%20${encodeURIComponent(fixture.name)}`);
                            }}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Create Ticket
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
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
