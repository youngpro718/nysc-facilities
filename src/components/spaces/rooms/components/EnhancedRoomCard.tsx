import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Lightbulb, 
  Shield, 
  AlertTriangle, 
  Activity,
  Thermometer,
  Wifi,
  Camera,
  MoreHorizontal,
  MapPin
} from "lucide-react";
import { EnhancedRoom } from "../types/EnhancedRoomTypes";
import { useCourtIssuesIntegration } from "@/hooks/useCourtIssuesIntegration";
import { getNormalizedCurrentUse } from "../utils/currentUse";

interface EnhancedRoomCardProps {
  room: EnhancedRoom;
  onDelete: (id: string) => void;
  onRoomClick?: (room: EnhancedRoom) => void;
  variant?: 'default' | 'compact' | 'detailed';
}

export function EnhancedRoomCard({ 
  room, 
  onDelete, 
  onRoomClick, 
  variant = 'default' 
}: EnhancedRoomCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate room health score (mock data for demo)
  const healthScore = 85; // This would come from real data
  const occupancyRate = 75; // This would come from real data
  // Unresolved issues for this room (open or in_progress from hook)
  const { getIssuesForRoom, hasUrgentIssues } = useCourtIssuesIntegration();
  const unresolvedIssues = getIssuesForRoom(room.id);
  const hasIssues = unresolvedIssues.length > 0;
  const highSeverityCount = unresolvedIssues.filter(i => ["urgent", "high", "critical"].includes((i.priority || "").toLowerCase())).length;
  const currentUse = getNormalizedCurrentUse(room);

  // Visual highlight classes for rooms with issues (yellow glow; red for urgent)
  const issueGlowClasses = hasIssues
    ? (hasUrgentIssues(room.id)
        ? 'ring-2 ring-red-500/60 shadow-[0_0_18px_rgba(239,68,68,0.6)] animate-pulse'
        : 'ring-2 ring-yellow-500/60 shadow-[0_0_16px_rgba(234,179,8,0.6)] animate-yellow-glow')
    : '';

  // Room type color mapping
  const getRoomTypeColor = (type: string) => {
    const colors = {
      'office': 'from-blue-500/20 to-blue-600/20 border-blue-200',
      'courtroom': 'from-purple-500/20 to-purple-600/20 border-purple-200',
      'chamber': 'from-green-500/20 to-green-600/20 border-green-200',
      'storage': 'from-orange-500/20 to-orange-600/20 border-orange-200',
      'utility_room': 'from-gray-500/20 to-gray-600/20 border-gray-200',
      'female_locker_room': 'from-pink-500/20 to-pink-600/20 border-pink-200',
      'male_locker_room': 'from-cyan-500/20 to-cyan-600/20 border-cyan-200',
    };
    return colors[type as keyof typeof colors] || 'from-slate-500/20 to-slate-600/20 border-slate-200';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'text-green-600 bg-green-50 border-green-200',
      'inactive': 'text-red-600 bg-red-50 border-red-200',
      'maintenance': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'vacant': 'text-gray-600 bg-gray-50 border-gray-200',
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  if (variant === 'compact') {
    return (
      <Card 
        className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-gradient-to-br ${getRoomTypeColor(room.room_type)} ${issueGlowClasses}`}
        onClick={() => onRoomClick?.(room)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${room.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
              <h4 className="font-semibold text-sm truncate">{room.name}</h4>
            </div>
            {hasIssues && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </div>
          <p className="text-xs text-muted-foreground mb-2">Room {room.room_number}</p>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {room.room_type.replace(/_/g, ' ')}
            </Badge>
            <div className="flex items-center space-x-1">
              {room.current_occupants && room.current_occupants.length > 0 && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Users className="h-3 w-3 mr-1" />
                  {room.current_occupants.length}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] bg-gradient-to-br ${getRoomTypeColor(room.room_type)} ${variant === 'detailed' ? 'h-[400px]' : 'h-[320px]'} ${issueGlowClasses}`}
      onClick={() => onRoomClick?.(room)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Health Score Ring */}
      <div className="absolute top-3 right-3 z-10">
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${healthScore}, 100`}
              className={healthScore > 80 ? "text-green-500" : healthScore > 60 ? "text-yellow-500" : "text-red-500"}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold">{healthScore}</span>
          </div>
        </div>
      </div>

      {/* Issue Alert */}
      {hasIssues && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
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

      <CardContent className="p-5 h-full flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground truncate">{room.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Room {room.room_number}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mb-3">
            <Badge 
              variant="outline" 
              className={`text-xs ${getStatusColor(room.status)}`}
            >
              {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {room.room_type.replace(/_/g, ' ')}
            </Badge>
            {room.is_storage && (
              <Badge variant="outline" className="text-xs">
                Storage
              </Badge>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-background/50 rounded-lg">
              <Activity className="h-4 w-4 mx-auto mb-1 text-blue-500" />
              <p className="text-xs font-medium">{occupancyRate}%</p>
              <p className="text-xs text-muted-foreground">Usage</p>
            </div>
            <div className="text-center p-2 bg-background/50 rounded-lg">
              <Thermometer className="h-4 w-4 mx-auto mb-1 text-green-500" />
              <p className="text-xs font-medium">72°F</p>
              <p className="text-xs text-muted-foreground">Temp</p>
            </div>
            <div className="text-center p-2 bg-background/50 rounded-lg">
              <Wifi className="h-4 w-4 mx-auto mb-1 text-purple-500" />
              <p className="text-xs font-medium">Good</p>
              <p className="text-xs text-muted-foreground">Signal</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          {/* Current Function */}
          {currentUse && (
            <div>
              <p className="text-sm font-medium text-foreground">Current Use</p>
              <p className="text-sm text-muted-foreground">{currentUse}</p>
            </div>
          )}

          {/* Occupancy Progress */}
          {room.current_occupants && room.current_occupants.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Occupants
                </span>
                <span className="text-sm text-muted-foreground">
                  {room.current_occupants.length}/10
                </span>
              </div>
              <Progress value={(room.current_occupants.length / 10) * 100} className="h-2" />
              <div className="flex flex-wrap gap-1 mt-2">
                {room.current_occupants.slice(0, 2).map((occupant, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {occupant.first_name} {occupant.last_name}
                  </Badge>
                ))}
                {room.current_occupants.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{room.current_occupants.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {room.description && variant === 'detailed' && (
            <div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {room.description}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={`transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" title="Lighting">
                <Lightbulb className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" title="Access Control">
                <Shield className="h-4 w-4" />
              </Button>
              {room.room_type === 'courtroom' && (
                <Button variant="ghost" size="sm" title="Camera System">
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
