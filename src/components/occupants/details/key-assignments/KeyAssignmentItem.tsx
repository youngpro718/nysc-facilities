
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { KeyRound, MapPin } from "lucide-react";

interface KeyAssignment {
  id: string;
  key: {
    name: string;
    is_passkey: boolean;
    key_door_locations?: Array<{
      door_location: string;
    }>;
  };
  assigned_at: string;
  returned_at?: string;
  is_spare: boolean;
  return_reason?: string;
}

interface KeyAssignmentItemProps {
  assignment: KeyAssignment;
}

export function KeyAssignmentItem({ assignment }: KeyAssignmentItemProps) {
  const { key, assigned_at, returned_at, is_spare, return_reason } = assignment;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const doorLocations = key.key_door_locations || [];
  const hasLocations = doorLocations.length > 0;

  return (
    <div className="flex items-start justify-between p-3 border rounded-lg">
      <div className="flex items-start gap-3">
        <KeyRound className="h-4 w-4 mt-1 text-muted-foreground" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{key.name}</span>
            {key.is_passkey && (
              <Badge variant="secondary" className="text-xs">
                Passkey
              </Badge>
            )}
            {is_spare && (
              <Badge variant="outline" className="text-xs">
                Spare
              </Badge>
            )}
          </div>
          
          {hasLocations && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>
                {doorLocations.map(loc => loc.door_location).join(', ')}
              </span>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            Assigned: {formatDate(assigned_at)}
            {returned_at && (
              <span className="ml-2">
                • Returned: {formatDate(returned_at)}
                {return_reason && ` (${return_reason})`}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div>
        {returned_at ? (
          <Badge variant="outline">Returned</Badge>
        ) : (
          <Badge variant="default">Active</Badge>
        )}
      </div>
    </div>
  );
}
