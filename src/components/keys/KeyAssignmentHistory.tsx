import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function KeyAssignmentHistory({ keyId }: { keyId: string }) {
  const [error, setError] = useState<string | null>(null);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["keyAssignments", keyId],
    queryFn: async () => {
      console.log("Fetching assignments for key:", keyId); // Debug log

      const { data, error } = await supabase
        .from("key_assignments")
        .select(`
          id,
          key_id,
          occupant_id,
          assigned_at,
          returned_at,
          return_reason,
          occupant:occupants!key_assignments_occupant_id_fkey (
            id,
            first_name,
            last_name,
            department
          )
        `)
        .eq("key_id", keyId)
        .order("assigned_at", { ascending: false });

      if (error) {
        console.error("Error fetching assignments:", error); // Debug log
        setError(error.message);
        return [];
      }
      
      console.log("Key assignments data:", data); // Debug log
      return data;
    },
  });

  if (error) {
    return <div className="text-red-500">Error loading assignments: {error}</div>;
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Assigned To</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Assigned Date</TableHead>
            <TableHead>Return Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments && assignments.length > 0 ? (
            assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>
                  {(assignment.occupant as any) ? 
                    `${(assignment.occupant as any)?.first_name || ''} ${(assignment.occupant as any)?.last_name || ''}`.trim() : 
                    "N/A"}
                </TableCell>
                <TableCell>{(assignment.occupant as any)?.department || "N/A"}</TableCell>
                <TableCell>
                  {format(new Date(assignment.assigned_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  {assignment.returned_at
                    ? format(new Date(assignment.returned_at), "MMM d, yyyy")
                    : "Not returned"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      !assignment.returned_at
                        ? "default"
                        : assignment.return_reason === "lost"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {!assignment.returned_at
                      ? "Active"
                      : assignment.return_reason || "Returned"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No assignment history found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}