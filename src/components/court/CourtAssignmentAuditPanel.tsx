import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { History, ArrowRight, UserCheck, UserMinus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const ACTION_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  assigned: { label: "Assigned", variant: "default", icon: UserCheck },
  reassigned: { label: "Reassigned", variant: "secondary", icon: ArrowRight },
  cleared: { label: "Cleared", variant: "destructive", icon: UserMinus },
  updated: { label: "Updated", variant: "outline", icon: RefreshCw },
  deleted: { label: "Deleted", variant: "destructive", icon: UserMinus },
  swapped: { label: "Swapped", variant: "secondary", icon: ArrowRight },
  covered: { label: "Covered", variant: "outline", icon: UserCheck },
};

function ChangeSummary({ oldValues, newValues, changedFields }: {
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  changedFields: string[] | null;
}) {
  if (!changedFields?.length) return <span className="text-muted-foreground text-xs">—</span>;

  return (
    <div className="space-y-0.5">
      {changedFields.map((field) => {
        const oldVal = oldValues?.[field] ?? "—";
        const newVal = newValues?.[field] ?? "—";
        const displayOld = Array.isArray(oldVal) ? oldVal.join(", ") : String(oldVal || "—");
        const displayNew = Array.isArray(newVal) ? newVal.join(", ") : String(newVal || "—");
        return (
          <div key={field} className="text-xs flex items-center gap-1 flex-wrap">
            <span className="font-medium capitalize">{field}:</span>
            <span className="text-muted-foreground line-through">{displayOld}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span>{displayNew}</span>
          </div>
        );
      })}
    </div>
  );
}

export function CourtAssignmentAuditPanel() {
  const [limit, setLimit] = useState(50);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["court-assignment-audit", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("court_assignment_audit_log")
        .select("*")
        .order("performed_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Assignment History
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {logs?.length ?? 0} entries
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Loading history…</div>
        ) : !logs?.length ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No assignment changes recorded yet.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">When</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                    <TableHead className="w-[90px]">Room</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead className="w-[120px]">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: Record<string, unknown>) => {
                    const config = ACTION_CONFIG[log.action_type as string] || ACTION_CONFIG.updated;
                    const Icon = config.icon;
                    return (
                      <TableRow key={log.id as string}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.performed_at as string), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.variant} className="text-[10px] gap-1">
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {(log.room_number as string) || "—"}
                        </TableCell>
                        <TableCell>
                          <ChangeSummary
                            oldValues={log.old_values as Record<string, unknown> | null}
                            newValues={log.new_values as Record<string, unknown> | null}
                            changedFields={log.changed_fields as string[] | null}
                          />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                          {(log.notes as string) || (log.reason as string) || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {logs.length >= limit && (
              <div className="p-3 text-center border-t">
                <Button variant="ghost" size="sm" onClick={() => setLimit((l) => l + 50)}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
