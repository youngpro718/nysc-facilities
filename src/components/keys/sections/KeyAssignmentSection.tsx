
import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { User, Key, ArrowLeftRight, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function KeyAssignmentSection() {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["active-key-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("key_assignments")
        .select(`
          id,
          assigned_at,
          is_spare,
          spare_key_reason,
          keys:key_id (
            id,
            name,
            type,
            is_passkey
          ),
          occupant:occupant_id (
            id,
            first_name,
            last_name,
            department
          )
        `)
        .is("returned_at", null)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleReturn = async (assignmentId: string) => {
    const { error } = await supabase
      .from("key_assignments")
      .update({
        returned_at: new Date().toISOString(),
        return_reason: "normal_return"
      })
      .eq("id", assignmentId);

    if (error) {
      console.error("Error returning key:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Active Assignments</h2>
        <p className="text-muted-foreground">Currently assigned keys and their holders</p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Assigned Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments?.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    {assignment.keys?.name}
                    {assignment.keys?.is_passkey && (
                      <Badge variant="secondary">Passkey</Badge>
                    )}
                    {assignment.is_spare && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600 flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              Spare
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Reason: {assignment.spare_key_reason}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {assignment.occupant?.first_name} {assignment.occupant?.last_name}
                  </div>
                </TableCell>
                <TableCell>{assignment.occupant?.department}</TableCell>
                <TableCell>
                  {format(new Date(assignment.assigned_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReturn(assignment.id)}
                  >
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Return Key
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
