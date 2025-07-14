import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Edit, Trash2, Calendar, MapPin, User } from "lucide-react";
import { CreateAssignmentDialog } from "./CreateAssignmentDialog";
import { EditAssignmentDialog } from "./EditAssignmentDialog";
import { useToast } from "@/hooks/use-toast";

type CourtAssignment = {
  id: string;
  term_id: string;
  room_id: string;
  room_number: string;
  part: string;
  justice: string;
  clerks: string[];
  sergeant: string;
  fax: string;
  tel: string;
  calendar_day: string;
  part_details: any;
  created_at: string;
  updated_at: string;
};

type CourtTerm = {
  id: string;
  term_name: string;
  term_number: string;
};

type CourtRoom = {
  id: string;
  room_number: string;
  courtroom_number: string;
};

export const AssignmentManagementPanel = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<CourtAssignment | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["court-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("court_assignments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CourtAssignment[];
    },
  });

  const { data: terms } = useQuery({
    queryKey: ["court-terms-for-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("court_terms")
        .select("id, term_name, term_number")
        .eq("status", "active")
        .order("term_name");
      if (error) throw error;
      return data as CourtTerm[];
    },
  });

  const { data: courtrooms } = useQuery({
    queryKey: ["court-rooms-for-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("court_rooms")
        .select("room_id, room_number, courtroom_number")
        .eq("is_active", true)
        .order("room_number");
      if (error) throw error;
      return data?.map(room => ({ id: room.room_id, room_number: room.room_number, courtroom_number: room.courtroom_number })) as CourtRoom[];
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("court_assignments")
        .delete()
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["court-assignments"] });
      toast({
        title: "Assignment deleted",
        description: "Court assignment has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete assignment: " + error.message,
      });
    },
  });

  const handleEdit = (assignment: CourtAssignment) => {
    setSelectedAssignment(assignment);
    setEditDialogOpen(true);
  };

  const handleDelete = async (assignment: CourtAssignment) => {
    if (confirm(`Are you sure you want to delete the assignment for Justice ${assignment.justice} in Part ${assignment.part}?`)) {
      deleteAssignmentMutation.mutate(assignment.id);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading assignments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Assignment Management</h2>
          <p className="text-muted-foreground">Create and manage court assignments</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Terms</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{terms?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Courtrooms</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courtrooms?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments?.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first court assignment to get started.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Assignment
            </Button>
          </Card>
        ) : (
          assignments?.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">Part {assignment.part}</CardTitle>
                      <Badge variant="secondary">Room {assignment.room_number}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Justice {assignment.justice}
                      </div>
                      {assignment.sergeant && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Sgt. {assignment.sergeant}
                        </div>
                      )}
                      {assignment.tel && (
                        <div className="flex items-center gap-1">
                          <span>Tel: {assignment.tel}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(assignment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(assignment)}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {(assignment.clerks?.length > 0 || assignment.fax || assignment.calendar_day) && (
                <CardContent>
                  <div className="space-y-2">
                    {assignment.clerks?.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Clerks: </span>
                        <span className="text-sm text-muted-foreground">
                          {assignment.clerks.join(", ")}
                        </span>
                      </div>
                    )}
                    {assignment.fax && (
                      <div>
                        <span className="text-sm font-medium">Fax: </span>
                        <span className="text-sm text-muted-foreground">{assignment.fax}</span>
                      </div>
                    )}
                    {assignment.calendar_day && (
                      <div>
                        <span className="text-sm font-medium">Calendar Day: </span>
                        <span className="text-sm text-muted-foreground">{assignment.calendar_day}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Dialogs */}
      <CreateAssignmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        courtrooms={courtrooms || []}
      />
      
      {selectedAssignment && (
        <EditAssignmentDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          assignment={selectedAssignment}
          terms={terms || []}
          courtrooms={courtrooms || []}
        />
      )}
    </div>
  );
};