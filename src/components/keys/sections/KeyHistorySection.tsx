
import { useMemo } from "react";
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
import { History, Key, User } from "lucide-react";
import { KeyAuditLog } from "../types/KeyTypes";

export function KeyHistorySection() {
  const { data: history, isLoading } = useQuery({
    queryKey: ["key-audit-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("key_audit_logs")
        .select(`
          id,
          action_type,
          created_at,
          changes,
          key_id,
          performed_by
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as KeyAuditLog[];
    },
  });

  // Collect occupant IDs referenced in changes to map to names
  const occupantIds = useMemo(() => {
    const set = new Set<string>();
    (history || []).forEach((log) => {
      const occId = (log as any)?.changes?.occupant_id as string | undefined;
      if (occId) set.add(occId);
    });
    return Array.from(set);
  }, [history]);

  const { data: occupantsMap } = useQuery({
    queryKey: ["audit-occupants-map", occupantIds.join(",")],
    enabled: occupantIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("occupants")
        .select("id, first_name, last_name")
        .in("id", occupantIds);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((o: any) => {
        map[o.id] = `${o.first_name ?? ""} ${o.last_name ?? ""}`.trim();
      });
      return map;
    },
  });

  const prettyLabel = (key: string) => {
    if (key === "occupant_id") return "Occupant";
    if (key === "assigned_at") return "Assigned At";
    if (key === "returned_at") return "Returned At";
    if (key === "is_spare") return "Spare Key";
    if (key === "recipient_type") return "Recipient Type";
    if (key === "recipient_name") return "Recipient Name";
    if (key === "recipient_email") return "Recipient Email";
    return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const prettyValue = (key: string, value: any) => {
    if (key === "occupant_id") {
      const name = occupantsMap?.[value as string];
      return name ? `${name}` : String(value);
    }
    if (/_at$/.test(key) && value) {
      try { return format(new Date(value), "MMM d, yyyy HH:mm"); } catch { return String(value); }
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  };

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
                      <span className="font-medium">{prettyLabel(key)}:</span> {prettyValue(key, value)}
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
