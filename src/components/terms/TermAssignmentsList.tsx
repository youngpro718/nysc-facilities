
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  SearchIcon, 
  PencilIcon, 
  Loader2,
  PhoneIcon,
  UserIcon,
  ShieldIcon
} from "lucide-react";
import { EditTermAssignmentDialog } from "./EditTermAssignmentDialog";
import { formatPhone, formatClerks } from "@/utils/formatters";
import { TermAssignment } from "@/types/terms";

interface TermAssignmentsListProps {
  termId: string;
  assignments?: TermAssignment[];
}

export function TermAssignmentsList({ termId, assignments: initialAssignments }: TermAssignmentsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingAssignment, setEditingAssignment] = useState<TermAssignment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["term-assignments", termId],
    queryFn: async () => {
      if (initialAssignments && initialAssignments.length > 0) {
        return initialAssignments;
      }
      
      const { data, error } = await supabase
        .from("term_assignments")
        .select("*")
        .eq("term_id", termId);
      
      if (error) throw error;
      return data as TermAssignment[];
    },
    initialData: initialAssignments,
    enabled: !!termId
  });

  const filteredAssignments = assignments?.filter(assignment => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (assignment.justice_name && assignment.justice_name.toLowerCase().includes(query)) ||
      (assignment.part_id && assignment.part_id.toLowerCase().includes(query)) ||
      (assignment.sergeant_name && assignment.sergeant_name.toLowerCase().includes(query))
    );
  });
  
  const handleAddAssignment = () => {
    setEditingAssignment(null);
    setIsDialogOpen(true);
  };

  const handleEditAssignment = (assignment: TermAssignment) => {
    setEditingAssignment(assignment);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md">
        <p className="text-muted-foreground mb-4">No assignments found for this term.</p>
        <Button onClick={handleAddAssignment}>
          <PencilIcon className="h-4 w-4 mr-2" />
          Add Assignment
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={handleAddAssignment}>
          <PencilIcon className="h-4 w-4 mr-2" />
          Add Assignment
        </Button>
      </div>

      <div className="border rounded-md">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part</TableHead>
                <TableHead>Justice</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Sergeant</TableHead>
                <TableHead>Court Officers</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments?.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.part_id || "—"}</TableCell>
                  <TableCell>{assignment.justice_name || "—"}</TableCell>
                  <TableCell>{assignment.room_id || "—"}</TableCell>
                  <TableCell>
                    {assignment.phone ? (
                      <span className="flex items-center gap-1">
                        <PhoneIcon className="h-3 w-3" />
                        {formatPhone(assignment.phone)}
                        {assignment.tel_extension && ` x${assignment.tel_extension}`}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {assignment.sergeant_name ? (
                      <span className="flex items-center gap-1">
                        <ShieldIcon className="h-3 w-3" />
                        {assignment.sergeant_name}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {assignment.clerk_names && assignment.clerk_names.length > 0 ? (
                      <span className="flex items-center gap-1">
                        <UserIcon className="h-3 w-3" />
                        {formatClerks(assignment.clerk_names)}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditAssignment(assignment)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <EditTermAssignmentDialog
        assignment={editingAssignment || undefined}
        termId={termId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
