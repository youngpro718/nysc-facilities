import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit2, Trash2, MapPin, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddRoomAssignmentForm } from "./AddRoomAssignmentForm";
import { EditRoomAssignmentDialog } from "../occupants/components/EditRoomAssignmentDialog";

interface ManageRoomsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  occupant: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  onSuccess: () => void;
}

export function ManageRoomsDialog({
  open,
  onOpenChange,
  occupant,
  onSuccess,
}: ManageRoomsDialogProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);

  // Fetch occupant's room assignments
  const { data: assignments, isLoading, refetch } = useQuery({
    queryKey: ["occupant-room-assignments", occupant.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("occupant_room_assignments")
        .select(`
          *,
          rooms!occupant_room_assignments_room_id_fkey (
            room_number,
            name,
            floors!rooms_floor_id_fkey (
              name,
              buildings!floors_building_id_fkey (
                name
              )
            )
          )
        `)
        .eq("occupant_id", occupant.id)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from("occupant_room_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success("Assignment removed successfully");
      refetch();
      onSuccess();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Failed to remove assignment");
    }
  };

  const getAssignmentTypeBadge = (type: string, isPrimary: boolean) => {
    const variant = isPrimary ? "default" : "secondary";
    const label = isPrimary ? "Primary" : "Secondary";
    
    return (
      <div className="flex items-center gap-2">
        <Badge variant={variant} className="text-xs">
          {label}
        </Badge>
        <span className="text-sm">{type.replace(/_/g, " ")}</span>
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Manage Room Assignments
            </DialogTitle>
            <DialogDescription>
              Manage room assignments for {occupant.first_name} {occupant.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">
                  {occupant.first_name} {occupant.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">{occupant.email}</p>
              </div>
              <Badge variant="outline">
                {assignments?.length || 0} Room{(assignments?.length || 0) !== 1 ? "s" : ""}
              </Badge>
            </div>

            <Separator />

            {/* Current Assignments */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Current Assignments</h4>
                <Button
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Assignment
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-4">Loading assignments...</div>
              ) : assignments?.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No room assignments found</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setShowAddForm(true)}
                    >
                      Add First Assignment
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {assignments?.map((assignment) => (
                    <Card key={assignment.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base flex items-center gap-2">
                              {(assignment.rooms as any)?.room_number} - {(assignment.rooms as any)?.name}
                              {assignment.is_primary && (
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              )}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {(assignment.rooms as any)?.floors?.buildings?.name} • {(assignment.rooms as any)?.floors?.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingAssignment(assignment)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAssignment(assignment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {getAssignmentTypeBadge(assignment.assignment_type, assignment.is_primary)}
                          
                          {assignment.schedule && (
                            <div className="text-sm">
                              <span className="font-medium">Schedule: </span>
                              {String(assignment.schedule)}
                            </div>
                          )}
                          
                          {assignment.notes && (
                            <div className="text-sm">
                              <span className="font-medium">Notes: </span>
                              {String(assignment.notes)}
                            </div>
                          )}
                          
                          <div className="text-xs text-muted-foreground">
                            Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Assignment Form */}
            {showAddForm && (
              <div className="space-y-4">
                <Separator />
                <AddRoomAssignmentForm
                  occupantId={occupant.id}
                  onSuccess={() => {
                    setShowAddForm(false);
                    refetch();
                    onSuccess();
                  }}
                  onCancel={() => setShowAddForm(false)}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      {editingAssignment && (
        <EditRoomAssignmentDialog
          open={!!editingAssignment}
          onOpenChange={(open) => {
            if (!open) setEditingAssignment(null);
          }}
          assignment={editingAssignment}
          occupantId={occupant.id}
          onSuccess={() => {
            setEditingAssignment(null);
            refetch();
            onSuccess();
          }}
        />
      )}
    </>
  );
}