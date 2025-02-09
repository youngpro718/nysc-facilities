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
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Key, 
  UserCheck, 
  UserX, 
  AlertTriangle, 
  Trash2,
  Plus,
  RotateCcw,
  Shield
} from "lucide-react";

type AuditLog = {
  id: string;
  key_id: string;
  action_type: string;
  performed_by: string | null;
  details: Record<string, any> | null;
  created_at: string;
  performer: {
    department: string | null;
  } | null;
}

export default function KeyAuditLogs({ keyId }: { keyId: string }) {
  const [error, setError] = useState<string | null>(null);

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["keyAuditLogs", keyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("key_audit_logs")
        .select(`
          *,
          performer:profiles(department)
        `)
        .eq("key_id", keyId)
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        return [];
      }

      return data as unknown as AuditLog[];
    },
  });

  if (error) {
    return <div className="text-red-500">Error loading audit logs: {error}</div>;
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

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <Plus className="h-4 w-4" />;
      case "assigned":
        return <UserCheck className="h-4 w-4" />;
      case "returned":
        return <RotateCcw className="h-4 w-4" />;
      case "lost":
        return <AlertTriangle className="h-4 w-4" />;
      case "decommissioned":
        return <Trash2 className="h-4 w-4" />;
      default:
        return <Key className="h-4 w-4" />;
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "created":
        return "default";
      case "assigned":
        return "secondary";
      case "returned":
        return "outline";
      case "lost":
        return "destructive";
      case "decommissioned":
        return "destructive";
      default:
        return "default";
    }
  };

  const formatDetails = (details: Record<string, any>) => {
    if (!details || typeof details !== 'object') return [];
    
    // Filter out unnecessary details for creation
    if (details.type && details.name) {
      return [
        { key: 'name', value: details.name },
        { key: 'type', value: details.type }
      ];
    }
    
    return Object.entries(details)
      .filter(([key]) => !['type', 'previous_status', 'new_status'].includes(key))
      .map(([key, value]) => {
        // Format dates if the key suggests it's a date
        if (key.includes('_at') || key.includes('_date')) {
          try {
            return {
              key: key.replace(/_/g, ' '),
              value: format(new Date(value as string), "MMM d, yyyy HH:mm")
            };
          } catch {
            return { key: key.replace(/_/g, ' '), value: String(value) };
          }
        }
        return { key: key.replace(/_/g, ' '), value: String(value) };
      });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Performed By</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {auditLogs?.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <Badge 
                  variant={getActionBadgeVariant(log.action_type)}
                  className="flex items-center gap-1"
                >
                  {getActionIcon(log.action_type)}
                  <span className="capitalize">{log.action_type}</span>
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  {log.performer?.department || "Administration"}
                </div>
              </TableCell>
              <TableCell>
                {log.details && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    {formatDetails(log.details).map(({ key, value }) => (
                      <div key={key} className="flex gap-2">
                        <span className="font-medium capitalize">{key}:</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
              </TableCell>
            </TableRow>
          ))}
          {auditLogs?.length === 0 && (
            <TableRow>
              <TableCell 
                colSpan={4} 
                className="text-center text-muted-foreground h-24"
              >
                <div className="flex flex-col items-center gap-2">
                  <Key className="h-8 w-8 opacity-50" />
                  <span>No audit history found</span>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}