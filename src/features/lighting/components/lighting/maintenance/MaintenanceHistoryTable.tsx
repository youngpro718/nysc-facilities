
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
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  AlertCircle, 
  Clock, 
  Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function MaintenanceHistoryTable() {
  const [page, setPage] = useState(0);
  const pageSize = 10;
  
  const { data, isLoading } = useQuery({
    queryKey: ['maintenance-history', page],
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await supabase
        .from('lighting_maintenance_schedules')
        .select(`
          *,
          lighting_fixtures(name, type),
          profiles!lighting_maintenance_schedules_assigned_technician_fkey(first_name, last_name)
        `, { count: 'exact' })
        .order('scheduled_date', { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      
      return {
        records: data || [],
        totalCount: count || 0
      };
    }
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="gap-1"><Check className="h-3 w-3" /> Completed</Badge>;
      case 'scheduled':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Scheduled</Badge>;
      case 'in_progress':
        return <Badge className="gap-1">In Progress</Badge>;
      case 'overdue':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge>Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };
  
  const totalPages = Math.ceil((data?.totalCount || 0) / pageSize);
  
  const goToNextPage = () => {
    if (page < totalPages - 1) {
      setPage(page + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading maintenance history...</div>;
  }
  
  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Fixture</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Assigned To</TableHead>
              <TableHead className="hidden md:table-cell">Scheduled By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No maintenance history found.
                </TableCell>
              </TableRow>
            ) : (
              data?.records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {format(new Date(record.scheduled_date), "yyyy-MM-dd")}
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(record.scheduled_date), "h:mm a")}
                    </div>
                  </TableCell>
                  <TableCell>{record.lighting_fixtures?.name || "Unknown"}</TableCell>
                  <TableCell>{record.maintenance_type}</TableCell>
                  <TableCell>{getPriorityBadge(record.priority_level)}</TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {record.profiles ? 
                      `${record.profiles.first_name} ${record.profiles.last_name}` : 
                      "Unassigned"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Download report">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, data?.totalCount || 0)} of {data?.totalCount} entries
        </p>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousPage}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm">
            Page {page + 1} of {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextPage}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
