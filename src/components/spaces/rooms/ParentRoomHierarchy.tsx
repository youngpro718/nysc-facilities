import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowRight, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ParentRoomHierarchyProps {
  roomId: string;
  showChildren?: boolean;
  showParent?: boolean;
  compact?: boolean;
}

interface RoomHierarchyData {
  id: string;
  name: string;
  room_number: string;
  parent_room_id: string | null;
  parent_name: string | null;
  parent_room_number: string | null;
  child_count: number;
}

export function ParentRoomHierarchy({ 
  roomId, 
  showChildren = true, 
  showParent = true, 
  compact = false 
}: ParentRoomHierarchyProps) {
  const { data: roomData } = useQuery({
    queryKey: ["room-hierarchy", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_hierarchy_view')
        .select('*')
        .eq('id', roomId)
        .single();
        
      if (error) throw error;
      return data as RoomHierarchyData;
    },
  });

  const { data: children } = useQuery({
    queryKey: ["room-children", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_child_rooms', { parent_room_id: roomId });
        
      if (error) throw error;
      return data || [];
    },
    enabled: showChildren,
  });

  const { data: parentChain } = useQuery({
    queryKey: ["room-parent-chain", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_parent_chain', { child_room_id: roomId });
        
      if (error) throw error;
      return data || [];
    },
    enabled: showParent && roomData?.parent_room_id !== null,
  });

  if (!roomData) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {roomData.parent_room_id && showParent && (
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            <span>Child of {roomData.parent_room_number}</span>
          </div>
        )}
        {roomData.child_count > 0 && showChildren && (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <Badge variant="secondary" className="text-xs">
              {roomData.child_count} {roomData.child_count === 1 ? 'child' : 'children'}
            </Badge>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Parent Chain */}
      {showParent && parentChain && parentChain.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Parent Hierarchy
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 text-sm">
              {parentChain.map((parent: any, index: number) => (
                <div key={parent.parent_id} className="flex items-center gap-2">
                  <span className="font-medium">
                    {parent.parent_room_number} - {parent.parent_name}
                  </span>
                  {index < parentChain.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              ))}
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <Badge variant="outline">Current Room</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Child Rooms */}
      {showChildren && children && children.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Child Rooms ({children.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-2">
              {children.map((child: any) => (
                <div
                  key={child.child_id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {child.child_room_number}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {child.child_name}
                    </span>
                  </div>
                  {child.depth > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      Level {child.depth}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}