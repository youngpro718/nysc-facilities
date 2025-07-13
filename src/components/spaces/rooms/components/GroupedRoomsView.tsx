import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Home, Users } from "lucide-react";
import { Room } from "../types/RoomTypes";
import { SimpleRoomCard } from "./SimpleRoomCard";
import { GroupedRooms } from "../../hooks/useHierarchyFilters";

interface GroupedRoomsViewProps {
  groupedRooms: GroupedRooms;
  onDelete: (id: string) => void;
  view: "grid" | "list";
  onRoomClick?: (room: Room) => void;
}

export function GroupedRoomsView({ groupedRooms, onDelete, view, onRoomClick }: GroupedRoomsViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (parentId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedGroups(newExpanded);
  };

  const expandAll = () => {
    setExpandedGroups(new Set(groupedRooms.parentRooms.map(room => room.id)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Control buttons */}
      {groupedRooms.parentRooms.length > 0 && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      )}

      {/* Parent room groups */}
      {groupedRooms.parentRooms.map((parentRoom) => {
        const children = groupedRooms.childRooms[parentRoom.id] || [];
        const isExpanded = expandedGroups.has(parentRoom.id);
        
        return (
          <Card key={parentRoom.id} className="overflow-hidden">
            <Collapsible 
              open={isExpanded} 
              onOpenChange={() => toggleGroup(parentRoom.id)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="hover:bg-muted/50 cursor-pointer pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <Home className="h-4 w-4 text-blue-500" />
                      {parentRoom.name}
                      <Badge variant="secondary" className="text-xs">
                        Parent Room
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {children.length} {children.length === 1 ? 'child' : 'children'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {parentRoom.room_number}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  {/* Parent room card */}
                  <div className="mb-4 border-l-4 border-blue-500 pl-4">
                    <SimpleRoomCard room={parentRoom} onDelete={onDelete} onRoomClick={onRoomClick} />
                  </div>
                  
                  {/* Child rooms */}
                  {children.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Child Rooms ({children.length})
                      </div>
                      <div className={
                        view === 'grid' 
                          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-4" 
                          : "space-y-2 ml-4"
                      }>
                        {children.map((childRoom) => (
                          <div key={childRoom.id} className="border-l-2 border-green-500 pl-4">
                            <SimpleRoomCard room={childRoom} onDelete={onDelete} onRoomClick={onRoomClick} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}

      {/* Independent rooms */}
      {groupedRooms.orphanRooms.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="h-4 w-4 text-orange-500" />
              Independent Rooms
              <Badge variant="outline" className="text-xs">
                {groupedRooms.orphanRooms.length} rooms
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={
              view === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                : "space-y-2"
            }>
              {groupedRooms.orphanRooms.map((room) => (
                <SimpleRoomCard key={room.id} room={room} onDelete={onDelete} onRoomClick={onRoomClick} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}