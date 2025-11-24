
import { EnhancedRoom } from "../types/EnhancedRoomTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowRightFromLine, Users, Shield, Lightbulb, ShoppingBag, AlertTriangle, Phone, Building, Pencil } from "lucide-react";
import { EditSpaceDialog } from "../../EditSpaceDialog";
import { RoomLightingManager } from "./lighting/RoomLightingManager";
import { useCourtIssuesIntegration } from "@/hooks/useCourtIssuesIntegration";
import { getNormalizedCurrentUse } from "../utils/currentUse";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CardFrontProps {
  room: EnhancedRoom;
  onFlip: (e?: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  isHovered?: boolean;
}

export function CardFront({ room, onFlip, onDelete, isHovered = false }: CardFrontProps) {
  const { getIssuesForRoom } = useCourtIssuesIntegration();
  const unresolvedIssues = getIssuesForRoom(room.id);
  const hasIssues = unresolvedIssues.length > 0;
  const highSeverityCount = unresolvedIssues.filter(i => ["urgent", "high", "critical"].includes((i.priority || "").toLowerCase())).length;
  const currentUse = getNormalizedCurrentUse(room);
  
  const totalLights = room.total_fixtures_count ?? room.lighting_fixtures?.length ?? 0;
  const functionalLights = room.functional_fixtures_count ?? room.lighting_fixtures?.filter(f => f.status === 'functional')?.length ?? 0;
  const lightingPercentage = totalLights > 0 ? Math.round((functionalLights / totalLights) * 100) : 100;
  
  return (
    <div className="relative flex flex-col h-full bg-gradient-to-br from-background to-muted/20">
      {/* Hero Header with Room Info */}
      <div className="relative p-6 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold text-foreground truncate mb-1">
              {room.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Room {room.room_number}</span>
              <span className="text-border">•</span>
              <span className="capitalize">{room.room_type.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onFlip(e); }}
            className="shrink-0 hover:bg-primary/10"
          >
            <ArrowRightFromLine className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics - Lighting & Issues as Top Priority */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Lighting Status - Large Visual */}
          <div className="col-span-2 sm:col-span-1">
            <RoomLightingManager
              room={room}
              trigger={
                <div className="relative h-32 sm:h-40 bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-all group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Lighting Status</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center h-16 sm:h-20">
                    <div className="relative">
                      <svg className="transform -rotate-90 w-20 h-20 sm:w-24 sm:h-24">
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className="text-muted/30"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 32}`}
                          strokeDashoffset={`${2 * Math.PI * 32 * (1 - lightingPercentage / 100)}`}
                          className={`transition-all duration-500 ${
                            lightingPercentage >= 80 ? 'text-green-500' : 
                            lightingPercentage >= 50 ? 'text-yellow-500' : 
                            'text-red-500'
                          }`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl sm:text-2xl font-bold">{lightingPercentage}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-xs text-muted-foreground">
                      {functionalLights}/{totalLights} functional
                    </span>
                  </div>
                </div>
              }
            />
          </div>

          {/* Issues Status - Large Visual */}
          <div className="col-span-2 sm:col-span-1">
            <div className={`relative h-32 sm:h-40 bg-card border rounded-lg p-4 transition-all ${
              hasIssues ? 'border-red-500/50 bg-red-500/5' : 'border-green-500/50 bg-green-500/5'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${hasIssues ? 'text-red-500' : 'text-green-500'}`} />
                  <span className="text-xs font-medium text-muted-foreground">Open Issues</span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center h-16 sm:h-20">
                <div className={`text-4xl sm:text-5xl font-bold ${hasIssues ? 'text-red-500' : 'text-green-500'}`}>
                  {unresolvedIssues.length}
                </div>
                {hasIssues && highSeverityCount > 0 && (
                  <Badge variant="destructive" className="mt-2">
                    {highSeverityCount} urgent
                  </Badge>
                )}
              </div>
              {!hasIssues && (
                <div className="text-center mt-2">
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    All Clear ✓
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Occupancy */}
          {room.current_occupants && room.current_occupants.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Occupants</span>
              </div>
              <div className="text-xl font-bold">{room.current_occupants.length}</div>
              <div className="text-xs text-muted-foreground truncate mt-1">
                {room.current_occupants[0]?.first_name} {room.current_occupants[0]?.last_name}
                {room.current_occupants.length > 1 && ` +${room.current_occupants.length - 1}`}
              </div>
            </div>
          )}

          {/* Quick Notes / Sticky Info */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400">📝</div>
              <span className="text-xs font-medium text-amber-800 dark:text-amber-300">Quick Notes</span>
            </div>
            <div className="space-y-1 min-h-[2rem]">
              {room.description ? (
                <p className="text-xs text-amber-900 dark:text-amber-200 line-clamp-2">
                  {room.description}
                </p>
              ) : (
                <p className="text-xs text-amber-600/60 dark:text-amber-400/60 italic">
                  No notes yet
                </p>
              )}
            </div>
            {/* Sticky note corner fold effect */}
            <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[12px] border-l-transparent border-b-[12px] border-b-amber-300 dark:border-b-amber-700 rounded-bl-sm" />
          </div>

          {/* Location */}
          <div className="col-span-2 bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Building className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Location</span>
            </div>
            <div className="text-sm font-medium truncate">
              {room.floor?.building?.name}
            </div>
            <div className="text-xs text-muted-foreground">
              Floor {room.floor?.name}
            </div>
          </div>
        </div>

        {/* Status & Badges */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={room.status === 'active' ? 'default' : 'destructive'}
              className="capitalize"
            >
              {room.status}
            </Badge>
            {room.is_storage && (
              <Badge variant="secondary">
                <ShoppingBag className="h-3 w-3 mr-1" />
                Storage
              </Badge>
            )}
            {room.temporary_storage_use && (
              <Badge variant="outline" className="border-amber-500 text-amber-700">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Temporary
              </Badge>
            )}
          </div>
          
          {currentUse && currentUse !== room.room_type.replace(/_/g, ' ') && (
            <div className="text-xs text-muted-foreground">
              Current use: {currentUse}
            </div>
          )}
        </div>
      </div>

      {/* Action Bar at Bottom */}
      <div className="p-4 border-t border-border/40 bg-muted/20">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <div className="flex items-center gap-1.5 flex-1">
              <Tooltip>
                <RoomLightingManager
                  room={room}
                  trigger={
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8">
                        <Lightbulb className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                  }
                />
                <TooltipContent>Manage lighting</TooltipContent>
              </Tooltip>

              {room.is_storage && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        const event = new CustomEvent('openInventoryDialog', { 
                          detail: { roomId: room.id, roomName: room.name } 
                        });
                        window.dispatchEvent(event);
                      }}
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Inventory</TooltipContent>
                </Tooltip>
              )}

              <div onClick={(e) => e.stopPropagation()}>
                <EditSpaceDialog
                  id={room.id}
                  type="room"
                  variant="custom"
                  initialData={{
                    id: room.id,
                    name: room.name,
                    room_number: room.room_number || '',
                    room_type: room.room_type,
                    description: room.description || '',
                    status: room.status,
                    floor_id: room.floor_id,
                    is_storage: room.is_storage || false,
                    storage_type: room.storage_type || null,
                    storage_capacity: room.storage_capacity || null,
                    storage_notes: room.storage_notes || null,
                    parent_room_id: room.parent_room_id || null,
                    current_function: room.current_function || null,
                    phone_number: room.phone_number || null,
                    courtroom_photos: room.courtroom_photos || null,
                    connections: room.space_connections?.map(conn => ({
                      id: conn.id,
                      connectionType: conn.connection_type,
                      toSpaceId: conn.to_space_id,
                      direction: conn.direction || null
                    })) || [],
                    type: "room"
                  }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit</TooltipContent>
                  </Tooltip>
                </EditSpaceDialog>
              </div>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onDelete(room.id); }}
                  className="h-8"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
