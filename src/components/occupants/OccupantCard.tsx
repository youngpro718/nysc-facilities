
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Building2, ChevronDown, DoorOpen, Key, Mail, Pencil, Phone, Trash2, UserCircle } from "lucide-react";
import { OccupantQueryResponse } from "./types/occupantTypes";

interface OccupantCardProps {
  occupant: OccupantQueryResponse;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (occupant: OccupantQueryResponse) => void;
  onDelete: (id: string) => void;
}

export function OccupantCard({
  occupant,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: OccupantCardProps) {
  const firstRoom = occupant.rooms?.[0];

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">
                {occupant.first_name} {occupant.last_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {occupant.title || "No title"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={occupant.status === 'active' ? 'default' : 'secondary'}>
                {occupant.status}
              </Badge>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>{occupant.department || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              <span>{occupant.title || "—"}</span>
            </div>
          </div>

          {/* Access Information */}
          <div className="flex justify-between items-center border-t pt-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{occupant.key_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <DoorOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{occupant.room_count || 0}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(occupant)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(occupant.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleExpand}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="space-y-4 border-t pt-4">
              {occupant.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${occupant.email}`} className="hover:text-primary">
                    {occupant.email}
                  </a>
                </div>
              )}
              {occupant.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${occupant.phone}`} className="hover:text-primary">
                    {occupant.phone}
                  </a>
                </div>
              )}
              {firstRoom && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {firstRoom.floors.buildings.name} - Room {firstRoom.room_number}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
