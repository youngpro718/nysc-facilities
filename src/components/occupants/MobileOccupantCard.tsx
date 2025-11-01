import { useState } from "react";
import { MobileCardView } from "@/components/mobile/MobileCardView";
import { MobileDetailsDialog } from "@/components/mobile/MobileDetailsDialog";
import { MobileActionSheet } from "@/components/mobile/MobileActionSheet";
import { MobileSearchBar } from "@/components/mobile/MobileSearchBar";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Users, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OccupantMobileCardProps {
  occupant: any;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export function MobileOccupantCard({ 
  occupant, 
  onClick, 
  onEdit, 
  onDelete,
  isSelected = false,
  onToggleSelect 
}: OccupantMobileCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'on_leave': return 'bg-yellow-500';
      case 'terminated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div 
      className={`bg-card rounded-lg border p-4 space-y-3 transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={occupant.profile_picture} />
              <AvatarFallback className="text-sm">
                {getInitials(occupant.first_name, occupant.last_name)}
              </AvatarFallback>
            </Avatar>
            <div 
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${getStatusColor(occupant.status)}`}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-base truncate">
              {occupant.first_name} {occupant.last_name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {occupant.job_title}
            </p>
            {occupant.department && (
              <Badge variant="outline" className="text-xs mt-1">
                {occupant.department}
              </Badge>
            )}
          </div>
        </div>

        {onToggleSelect && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
              isSelected 
                ? 'bg-primary border-primary text-primary-foreground' 
                : 'border-muted-foreground/30'
            }`}
          >
            {isSelected && <div className="w-2 h-2 bg-current rounded-full" />}
          </button>
        )}
      </div>

      <div className="space-y-2 text-sm">
        {occupant.email && (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{occupant.email}</span>
          </div>
        )}
        
        {occupant.phone && (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{occupant.phone}</span>
          </div>
        )}

        {occupant.current_room && (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="truncate">Room: {occupant.current_room}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <Badge 
          variant={occupant.status === 'active' ? 'default' : 'secondary'}
          className="text-xs"
        >
          {occupant.status.replace('_', ' ')}
        </Badge>
        
        <div className="flex items-center space-x-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="h-8 px-2"
            >
              Edit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}