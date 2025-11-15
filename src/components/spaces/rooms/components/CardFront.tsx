
import { EnhancedRoom } from "../types/EnhancedRoomTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, ArrowRightFromLine, Users, Shield, Lightbulb, ShoppingBag, AlertTriangle, Phone, Link2, CalendarDays, StickyNote, History, Pencil, Image } from "lucide-react";
import { EditSpaceDialog } from "../../EditSpaceDialog";
import { CourtroomPhotos } from './CourtroomPhotos';
import { CourtroomPhotoThumbnail } from './CourtroomPhotoThumbnail';
import { ParentRoomHierarchy } from "../ParentRoomHierarchy";
import { RoomAccessSummary } from "@/components/access/RoomAccessSummary";
import { SmartBadges } from "./badges/SmartBadges";
import { RoomLightingManager } from "./lighting/RoomLightingManager";
import { RoomRepurposingDialog } from "./repurposing/RoomRepurposingDialog";
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
  const formatRelative = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const diffMs = Date.now() - d.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) return "today";
    if (days === 1) return "1 day ago";
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months === 1) return "1 month ago";
    if (months < 12) return `${months} months ago`;
    const years = Math.floor(months / 12);
    return years === 1 ? "1 year ago" : `${years} years ago`;
  };
  return (
    <div className="relative p-5 flex flex-col h-full overflow-y-auto">
      {/* Actions moved into header row; removed absolute-positioned mobile flip */}
      {/* Issue Alert - Top Left Corner */}
      {hasIssues && (
        <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <Badge variant="destructive" className="text-[10px] flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {unresolvedIssues.length}
            <span className="hidden sm:inline">open</span>
            {highSeverityCount > 0 && (
              <span className="ml-1 text-[10px] bg-white/20 px-1 rounded">
                {highSeverityCount} high
              </span>
            )}
          </Badge>
        </div>
      )}
      {/* Absolute actions removed; actions moved into header below */}
      <div className="mb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{room.name}</h3>
            <p className="text-sm text-muted-foreground">Room {room.room_number}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <TooltipProvider>
              <div className="flex items-center gap-1 md:gap-1.5">
                {/* Flip for more details */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onFlip(e); }}
                      className="bg-black/80 hover:bg-black text-white border-0 shadow-lg transition-all duration-200 h-8 w-8 p-0"
                    >
                      <ArrowRightFromLine className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>More details</TooltipContent>
                </Tooltip>

                {/* Room lighting management - avoid nested Radix triggers on the same element */}
                <RoomLightingManager
                  room={room}
                  trigger={
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-black/80 hover:bg-black text-white border-0 shadow-lg transition-all duration-200 h-8 w-8 p-0"
                      title="Manage lighting"
                    >
                      <Lightbulb className="h-3 w-3" />
                    </Button>
                  }
                />

                {/* Inventory (for storage) */}
                {room.is_storage && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="bg-black/80 hover:bg-black text-white border-0 shadow-lg transition-all duration-200 h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          const event = new CustomEvent('openInventoryDialog', { 
                            detail: { roomId: room.id, roomName: room.name } 
                          });
                          window.dispatchEvent(event);
                        }}
                      >
                        <ShoppingBag className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View inventory</TooltipContent>
                  </Tooltip>
                )}

                {/* Access dialog */}
                <Dialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-black/80 hover:bg-black text-white border-0 shadow-lg transition-all duration-200 h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Shield className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Who has access</TooltipContent>
                  </Tooltip>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Room Access - {room.name}</DialogTitle>
                    </DialogHeader>
                    <RoomAccessSummary roomId={room.id} />
                  </DialogContent>
                </Dialog>

                {/* Edit room - remove Tooltip to avoid ref conflicts with DialogTrigger */}
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
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-black/80 hover:bg-black text-white border-0 shadow-lg transition-all duration-200 h-8 w-8 p-0"
                      title="Edit room"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </EditSpaceDialog>
                </div>

                {/* Delete room */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onDelete(room.id); }}
                      className="bg-red-600/90 hover:bg-red-600 text-white border-0 shadow-lg transition-all duration-200 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete room</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            <Badge 
              variant={
                room.status === 'active' ? 'default' :
                room.status === 'inactive' ? 'destructive' : 'outline'
              }
              className="ml-2"
            >
              {room.status.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <Badge 
            variant="secondary" 
            className="text-[11px] whitespace-nowrap"
          >
            {room.is_storage 
              ? `${room.room_type.replace(/_/g, ' ')} Storage`
              : room.room_type.replace(/_/g, ' ')
            }
          </Badge>

          {room.capacity_size_category && (
            <Badge 
              variant="outline" 
              className="text-[11px] capitalize whitespace-nowrap"
            >
              {room.capacity_size_category}
            </Badge>
          )}

          {/* Enhanced Temporary Usage Badge */}
          {(room.temporary_storage_use || (room.original_room_type && room.original_room_type !== room.room_type)) && (
            <div className="flex flex-wrap gap-1">
              {room.temporary_storage_use && (
                <Badge 
                  variant="secondary" 
                  className="text-[11px] flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                  title="Room is temporarily repurposed"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Temporary Storage
                </Badge>
              )}
              
              {room.original_room_type && room.original_room_type !== room.room_type && (
                <RoomRepurposingDialog
                  room={room}
                  onUpdate={() => window.location.reload()}
                  trigger={
                    <Badge 
                      variant="outline" 
                      className="text-[11px] flex items-center gap-1 cursor-pointer hover:bg-muted/50 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                      title={`Originally ${String(room.original_room_type).replace(/_/g, ' ')} - Click to manage repurposing`}
                    >
                      <History className="h-3 w-3" />
                      Originally {String(room.original_room_type).replace(/_/g, ' ')}
                    </Badge>
                  }
                />
              )}
            </div>
          )}
        </div>

        {/* Enhanced Smart Badges Section */}
        <div className="mt-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">Status & Information</div>
          <SmartBadges room={room} />
        </div>

        {/* Mobile Access Quick Action removed - actions are in header for all breakpoints */}

        {/* Quick Facts */}
        {(room.phone_number || (room.space_connections?.length ?? 0) > 0 || room.function_change_date || (room.room_type === 'courtroom' && room.court_room) || (room.is_storage && (room.storage_notes || '').trim() !== "")) && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
            {room.phone_number && (
              <div className="flex items-center text-muted-foreground">
                <Phone className="h-3.5 w-3.5 mr-1" />
                <a
                  href={`tel:${room.phone_number}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:underline"
                >
                  {room.phone_number}
                </a>
              </div>
            )}

            {(room.space_connections?.length ?? 0) > 0 && (
              <div 
                className="flex items-center text-muted-foreground"
                title={(room.space_connections || [])
                  .map(conn => conn.to_space?.name || conn.to_space?.type || '')
                  .filter(Boolean)
                  .slice(0, 5)
                  .join(', ')}
              >
                <Link2 className="h-3.5 w-3.5 mr-1" />
                {(room.space_connections?.length || 0)} connection{(room.space_connections?.length || 0) === 1 ? '' : 's'}
              </div>
            )}

            {room.function_change_date && (
              <div className="flex items-center text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 mr-1" />
                Changed {formatRelative(room.function_change_date)}
              </div>
            )}

            {/* Jury/Spectator capacities removed per UI simplification */}

            {room.is_storage && room.storage_notes && room.storage_notes.trim() !== "" && (
              <div className="flex items-center text-muted-foreground sm:col-span-2">
                <StickyNote className="h-3.5 w-3.5 mr-1" />
                <span className="truncate" title={room.storage_notes}>{room.storage_notes}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Parent-Child Hierarchy Info */}
        <div className="mt-2">
          <ParentRoomHierarchy roomId={room.id} compact={true} />
        </div>
        
        {/* Enhanced courtroom photos section */}
        {room.room_type === 'courtroom' && room.courtroom_photos && (
          <div className="mt-4 mb-3">
            <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Image className="h-3 w-3" />
              Courtroom Views
            </div>
            <CourtroomPhotoThumbnail photos={room.courtroom_photos} size="lg" />
          </div>
        )}
        
        {/* Display CourtroomPhotos dialog component if room is a courtroom */}
        {room.room_type === 'courtroom' && <CourtroomPhotos room={room} />}
        
        {/* Mobile-friendly inventory button for storage rooms */}
        {room.is_storage && (
          <div className="mt-2 md:hidden">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                const event = new CustomEvent('openInventoryDialog', { 
                  detail: { roomId: room.id, roomName: room.name } 
                });
                window.dispatchEvent(event);
              }}
              title="View Inventory"
            >
              <ShoppingBag className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1">
        {/* Enhanced Practical Room Information */}
        <div className="space-y-3 mb-4">
          {/* Room Function & Usage with visual emphasis */}
          {currentUse && (
            <div className="bg-muted/30 p-3 rounded-md">
              <div className="text-xs font-medium text-muted-foreground mb-1">Current Use</div>
              <div className="text-sm font-medium text-foreground">{currentUse}</div>
            </div>
          )}
          
          {/* Floor & Building Info with better spacing */}
          <div className="bg-muted/30 p-3 rounded-md">
            <div className="text-xs font-medium text-muted-foreground mb-1">Location</div>
            <div className="text-sm font-medium text-foreground">
              {room.floor?.building?.name}, Floor {room.floor?.name}
            </div>
          </div>

          {/* Visual Room Statistics Panel */}
          {(room.lighting_percentage !== undefined || room.history_stats) && (
            <div className="bg-muted/30 p-3 rounded-md">
              <div className="text-xs font-medium text-muted-foreground mb-2">Quick Stats</div>
              <div className="grid grid-cols-2 gap-3">
                {room.lighting_percentage !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{room.lighting_percentage}%</div>
                    <div className="text-xs text-muted-foreground">Lighting</div>
                    <div className="w-full bg-muted h-1 rounded-full mt-1">
                      <div 
                        className="h-1 rounded-full bg-primary" 
                        style={{ width: `${room.lighting_percentage}%` }}
                      />
                    </div>
                  </div>
                )}
                {room.history_stats && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{room.history_stats.total_issues}</div>
                    <div className="text-xs text-muted-foreground">Total Issues</div>
                    {room.history_stats.total_issues > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {room.history_stats.current_occupants} current occupants
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Description - expanded to use more space */}
        {room.description && room.description.trim() !== "" && !room.description.toLowerCase().includes("no description") ? (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {room.description}
            </p>
          </div>
        ) : null}

        {/* Enhanced Occupants Display */}
        {room.current_occupants && room.current_occupants.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                <span className="text-sm font-medium">Occupants</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {room.current_occupants.length} total
              </Badge>
            </div>
            <div className="space-y-2">
              {room.current_occupants.slice(0, 4).map((occupant, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {occupant.first_name?.[0]}{occupant.last_name?.[0]}
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {occupant.first_name} {occupant.last_name}
                    </span>
                  </div>
                  {occupant.assignment_type && (
                    <Badge variant="outline" className="text-xs">
                      {occupant.assignment_type.replace(/_/g, ' ')}{occupant.is_primary ? ' (Primary)' : ''}
                    </Badge>
                  )}
                </div>
              ))}
              {room.current_occupants.length > 4 && (
                <div className="text-center">
                  <Badge variant="outline" className="text-xs">
                    +{room.current_occupants.length - 4} more
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {room.updated_at && (
          <div className="mt-3 text-[11px] text-muted-foreground">
            Updated {formatRelative(room.updated_at)}
          </div>
        )}
      </div>

      {/* Old action buttons removed - now using hover overlay */}
    </div>
  );
}
