
import { EnhancedRoom } from "../types/EnhancedRoomTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowRightFromLine, Users, ShoppingBag, AlertTriangle, Building, Pencil, Layers } from "lucide-react";
import { EditSpaceDialog } from "../../EditSpaceDialog";
import { useCourtIssuesIntegration } from "@features/court/hooks/useCourtIssuesIntegration";
import { getNormalizedCurrentUse } from "../utils/currentUse";
import { buildRoomInitialData } from "../utils/roomInitialData";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RoomNotesPanel } from "./notes/RoomNotesPanel";
import { useChildRoomCount } from "@features/spaces/hooks/useChildRooms";
import { useRolePermissions } from "@features/auth/hooks/useRolePermissions";

interface CardFrontProps {
  room: EnhancedRoom;
  onFlip: (e?: React.MouseEvent) => void;
  onDelete?: (id: string) => void;
  isHovered?: boolean;
  onQuickNoteClick?: () => void;
}

export function CardFront({ room, onFlip, onDelete, isHovered = false, onQuickNoteClick }: CardFrontProps) {
  const { canAdmin } = useRolePermissions();
  const canManageSpaces = canAdmin('spaces');
  const { getIssuesForRoom } = useCourtIssuesIntegration();
  const unresolvedIssues = getIssuesForRoom(room.id);
  const hasIssues = unresolvedIssues.length > 0;
  const highSeverityCount = unresolvedIssues.filter(i => ["urgent", "high", "critical"].includes((i.priority || "").toLowerCase())).length;
  const currentUse = getNormalizedCurrentUse(room);
  const { data: childRoomCount = 0 } = useChildRoomCount(room.id);

  // Courtroom photos
  const isCourtroom = room.room_type === 'courtroom';
  const courtroomPhotos = room.courtroom_photos;
  // Handle both array and legacy string format
  const judgeViewPhotos = courtroomPhotos?.judge_view
    ? (Array.isArray(courtroomPhotos.judge_view) ? courtroomPhotos.judge_view : [courtroomPhotos.judge_view])
    : [];
  const audienceViewPhotos = courtroomPhotos?.audience_view
    ? (Array.isArray(courtroomPhotos.audience_view) ? courtroomPhotos.audience_view : [courtroomPhotos.audience_view])
    : [];
  const hasPhotos = judgeViewPhotos.length > 0 || audienceViewPhotos.length > 0;
  const heroPhoto = judgeViewPhotos[0] || audienceViewPhotos[0];

  return (
    <div className="relative flex flex-col h-full bg-gradient-to-br from-background to-muted/20">
      {/* Courtroom Hero Photo */}
      {isCourtroom && hasPhotos && heroPhoto && (
        <div className="relative h-32 w-full overflow-hidden">
          <img
            src={heroPhoto}
            alt="Courtroom"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <Badge className="absolute top-2 right-2 bg-background/80 text-foreground">
            Courtroom
          </Badge>
        </div>
      )}

      {/* Hero Header with Room Info */}
      <div className={`relative p-6 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent ${isCourtroom && hasPhotos ? '-mt-8 pt-2' : ''}`}>
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
          <div className="flex items-center gap-2 shrink-0">
            <TooltipProvider>
              {canManageSpaces && (
                <div onClick={(e) => e.stopPropagation()}>
                  <EditSpaceDialog
                    id={room.id}
                    type="room"
                    variant="custom"
                    initialData={buildRoomInitialData(room)}
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
              )}

              {canManageSpaces && onDelete && (
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
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onFlip(e); }}
                    className="h-8 hover:bg-primary/10"
                  >
                    <ArrowRightFromLine className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Go to detail</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Issues Status - Large Visual */}
          <div className="col-span-2">
            <div className={`relative min-h-[8rem] sm:min-h-[10rem] flex flex-col justify-between bg-card border rounded-lg p-4 transition-all ${hasIssues ? 'border-red-500/50 bg-red-500/5' : 'border-green-500/50 bg-green-500/5'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${hasIssues ? 'text-red-500' : 'text-green-500'}`} />
                  <span className="text-xs font-medium text-muted-foreground">Open Issues</span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 py-1">
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
                {(room.current_occupants[0] as Record<string, string>)?.first_name} {(room.current_occupants[0] as Record<string, string>)?.last_name}
                {room.current_occupants.length > 1 && ` +${room.current_occupants.length - 1}`}
              </div>
            </div>
          )}

          {/* Child Rooms Count */}
          {childRoomCount > 0 && (
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Sub-Rooms</span>
              </div>
              <div className="text-xl font-bold">{childRoomCount}</div>
              <div className="text-xs text-muted-foreground mt-1">
                nested spaces
              </div>
            </div>
          )}

          {/* Room Notes / Known Issues */}
          <div
            className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <RoomNotesPanel roomId={room.id} compact />
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

      {/* Action Bar at Bottom — only for storage rooms */}
      {room.is_storage && (
        <div className="p-4 border-t border-border/40 bg-muted/20">
          <div className="flex items-center gap-2">
            <TooltipProvider>
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
            </TooltipProvider>
          </div>
        </div>
      )}
    </div>
  );
}
