import React, { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  AlertTriangle, 
  Users, 
  Building,
  Trash2,
  Pencil,
  ChevronRight,
  MapPin
} from "lucide-react";
import { Room } from "../types/RoomTypes";
import { EnhancedRoom } from "../types/EnhancedRoomTypes";
import { useEnhancedRoomData } from "@/hooks/useEnhancedRoomData";
import { useCourtIssuesIntegration } from "@/hooks/useCourtIssuesIntegration";
import { EditSpaceDialog } from "../../EditSpaceDialog";
import { RoomQuickEditSheet } from "../../RoomQuickEditSheet";

interface MobileRoomCardProps {
  room: Room;
  onDelete: (id: string) => void;
  onRoomClick?: (room: Room) => void;
}

export function MobileRoomCard({ room, onDelete, onRoomClick }: MobileRoomCardProps) {
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const [isSwipedOpen, setIsSwipedOpen] = useState(false);
  
  // Fetch enhanced room data
  const { data: enhancedRoom } = useEnhancedRoomData(room.id);
  const { getIssuesForRoom } = useCourtIssuesIntegration();
  
  // Calculate stats
  const unresolvedIssues = getIssuesForRoom(room.id);
  const hasIssues = unresolvedIssues.length > 0;
  const highSeverityCount = unresolvedIssues.filter(
    i => ["urgent", "high", "critical"].includes((i.priority || "").toLowerCase())
  ).length;
  
  const totalLights = enhancedRoom?.total_fixtures_count ?? enhancedRoom?.lighting_fixtures?.length ?? 0;
  const functionalLights = enhancedRoom?.functional_fixtures_count ?? 
    enhancedRoom?.lighting_fixtures?.filter(f => f.status === 'functional')?.length ?? 0;
  const lightingPercentage = totalLights > 0 ? Math.round((functionalLights / totalLights) * 100) : 100;
  const hasLightingIssue = lightingPercentage < 80;
  
  const occupantCount = room.current_occupants?.length ?? 0;
  
  // Swipe gesture handling
  const x = useMotionValue(0);
  const actionWidth = 140; // Width of action buttons area
  
  // Transform for action buttons opacity
  const actionsOpacity = useTransform(x, [-actionWidth, -40, 0], [1, 0.5, 0]);
  const actionsScale = useTransform(x, [-actionWidth, -20, 0], [1, 0.8, 0.6]);
  
  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = actionWidth / 2;
    if (info.offset.x < -threshold) {
      setIsSwipedOpen(true);
    } else {
      setIsSwipedOpen(false);
    }
  };

  const getLightingColor = () => {
    if (lightingPercentage >= 80) return "text-green-500 bg-green-500/10";
    if (lightingPercentage >= 50) return "text-yellow-500 bg-yellow-500/10";
    return "text-red-500 bg-red-500/10";
  };

  const getStatusColor = () => {
    switch (room.status) {
      case 'active': return "bg-green-500";
      case 'inactive': return "bg-red-500";
      case 'under_maintenance': return "bg-yellow-500";
      default: return "bg-muted";
    }
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-xl">
        {/* Swipe Action Buttons (revealed on swipe) */}
        <motion.div 
          className="absolute inset-y-0 right-0 flex items-stretch"
          style={{ opacity: actionsOpacity, scale: actionsScale }}
        >
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
            <button className="w-[70px] flex items-center justify-center bg-blue-500 text-white touch-manipulation">
              <Pencil className="h-5 w-5" />
            </button>
          </EditSpaceDialog>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Delete this room?')) {
                onDelete(room.id);
              }
            }}
            className="w-[70px] flex items-center justify-center bg-destructive text-destructive-foreground touch-manipulation"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </motion.div>

        {/* Main Card Content (draggable) */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -actionWidth, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          animate={{ x: isSwipedOpen ? -actionWidth : 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{ x }}
          className="relative"
        >
          <Card 
            className="bg-card border-border/50 touch-manipulation active:bg-muted/50 transition-colors"
            onClick={() => {
              if (!isSwipedOpen) {
                onRoomClick?.(room);
              } else {
                setIsSwipedOpen(false);
              }
            }}
          >
            <div className="p-4 flex items-center gap-4">
              {/* Left: Status & Metrics Column */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                {/* Status Indicator */}
                <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
                
                {/* Lighting Mini Ring */}
                <div className={`relative w-11 h-11 rounded-full flex items-center justify-center ${getLightingColor()}`}>
                  <svg className="absolute inset-0 w-11 h-11 -rotate-90">
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className="opacity-20"
                    />
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 18}`}
                      strokeDashoffset={`${2 * Math.PI * 18 * (1 - lightingPercentage / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <Lightbulb className="h-4 w-4" />
                </div>
              </div>

              {/* Center: Room Info */}
              <div className="flex-1 min-w-0">
                {/* Room Name & Number */}
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-[17px] text-foreground truncate">
                    {room.name}
                  </h3>
                </div>
                
                <div className="flex items-center gap-2 text-[15px] text-muted-foreground mb-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    Room {room.room_number}
                    {room.floor?.building?.name && ` · ${room.floor.building.name}`}
                  </span>
                </div>
                
                {/* Quick Stats Row */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Room Type Badge */}
                  <Badge variant="secondary" className="text-xs capitalize h-6">
                    {room.room_type.replace(/_/g, ' ')}
                  </Badge>
                  
                  {/* Occupants */}
                  {occupantCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>{occupantCount}</span>
                    </div>
                  )}
                  
                  {/* Issues Indicator */}
                  {hasIssues && (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-xs text-red-500 font-medium">
                        {unresolvedIssues.length}
                        {highSeverityCount > 0 && ` (${highSeverityCount} urgent)`}
                      </span>
                    </div>
                  )}
                  
                  {/* Lighting Issue Flag */}
                  {hasLightingIssue && !hasIssues && (
                    <div className="flex items-center gap-1 text-xs text-yellow-600">
                      <Lightbulb className="h-3.5 w-3.5" />
                      <span>{lightingPercentage}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Chevron indicator */}
              <ChevronRight className="h-5 w-5 text-muted-foreground/50 shrink-0" />
            </div>
          </Card>
        </motion.div>
      </div>

      <RoomQuickEditSheet
        open={showQuickEdit}
        onClose={() => setShowQuickEdit(false)}
        roomId={room.id}
        roomType={room.room_type || 'office'}
        defaultSection="basic"
      />
    </>
  );
}
