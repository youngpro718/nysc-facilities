
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
import { format } from "date-fns";
import { History, Key, User } from "lucide-react";
import { KeyAuditLog } from "../types/KeyTypes";

export function KeyHistorySection() {
  const { data: history, isLoading } = useQuery({
    queryKey: ["key-audit-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("key_audit_logs_view")
        .select(`
          id,
          action_type,
          created_at,
          changes,
          key_id,
          performed_by,
          username,
          email
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as KeyAuditLog[];
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Key History</h2>
        <p className="text-muted-foreground">Recent key activities and changes</p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history?.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge 
                    variant={
                      log.action_type === "created" 
                        ? "default"
                        : log.action_type === "assigned" 
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {log.action_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {Object.entries(log.changes || {}).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium">{key}:</span> {String(value)}
                    </div>
                  ))}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {log.username || log.email || "System"}
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
