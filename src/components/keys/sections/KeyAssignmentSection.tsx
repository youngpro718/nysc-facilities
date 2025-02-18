
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
import { User, Key, ArrowLeftRight, Info, Calendar } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface KeyAssignment {
  id: string;
  assigned_at: string;
  is_spare: boolean;
  spare_key_reason: string | null;
  keys: {
    id: string;
    name: string;
    type: string;
    is_passkey: boolean;
  } | null;
  occupant: {
    id: string;
    first_name: string;
    last_name: string;
    department: string | null;
  } | null;
}

export function KeyAssignmentSection() {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { data: assignments, isLoading, refetch } = useQuery({
    queryKey: ["active-key-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("key_assignments")
        .select(`
          id,
          assigned_at,
          is_spare,
          spare_key_reason,
          keys (
            id,
            name,
            type,
            is_passkey
          ),
          occupant:occupants!fk_key_assignments_occupant (
            id,
            first_name,
            last_name,
            department
          )
        `)
        .is("returned_at", null)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data as unknown as KeyAssignment[];
    },
  });

  const getOccupantFullName = (occupant: KeyAssignment['occupant']) => {
    if (!occupant) return 'Unknown';
    return `${occupant.first_name} ${occupant.last_name}`;
  };

  const handleReturn = async (assignmentId: string, keyId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const { data: key, error: keyError } = await supabase
        .from("keys")
        .select("available_quantity")
        .eq("id", keyId)
        .single();

      if (keyError) throw keyError;

      const updates = await Promise.all([
        supabase
          .from("key_assignments")
          .update({
            returned_at: new Date().toISOString(),
            return_reason: "normal_return"
          })
          .eq("id", assignmentId),

        supabase
          .from("keys")
          .update({
            available_quantity: (key.available_quantity || 0) + 1
          })
          .eq("id", keyId)
      ]);

      const errors = updates.map(update => update.error).filter(Boolean);
      if (errors.length > 0) {
        throw new Error(errors[0]?.message);
      }

      toast.success(`Key returned successfully by ${getOccupantFullName(assignments?.find(a => a.id === assignmentId)?.occupant)}`);
      refetch();
    } catch (error: any) {
      console.error("Error returning key:", error);
      toast.error(error.message || "Failed to return key");
    } finally {
      setIsProcessing(false);
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
                    {getOccupantFullName(assignment.occupant)}
                  </div>
                </TableCell>
                <TableCell>{assignment.occupant?.department}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(assignment.assigned_at), "MMMM d, yyyy 'at' h:mm a")}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReturn(assignment.id, assignment.keys?.id || '')}
                    disabled={isProcessing}
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
