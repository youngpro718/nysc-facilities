
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Loader2, MoreVertical, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { 
  Issue, 
  IssueStatus, 
  IssuePriority, 
  FixtureType, 
  FixtureStatus,
  FixturePosition,
  ElectricalIssues,
  LightingFixture 
} from "./types/IssueTypes";

interface DatabaseLightingFixture {
  name: string;
  type: FixtureType;
  status: FixtureStatus;
  position: FixturePosition;
  electrical_issues: ElectricalIssues;
}

interface DatabaseIssue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  building_id?: string;
  floor_id?: string;
  room_id?: string;
  fixture_id?: string;
  photos: string[];
  created_at: string;
  updated_at: string;
  seen: boolean;
  assignee_id?: string;
  last_status_change?: string;
  last_updated_by?: string;
  tags?: string[];
  due_date?: string;
  type: string;
  buildings?: {
    name: string;
  } | null;
  floors?: {
    name: string;
  } | null;
  rooms?: {
    name: string;
  } | null;
  lighting_fixtures?: DatabaseLightingFixture[] | null;
}

export const IssuesList = () => {
  const queryClient = useQueryClient();

  const { data: issues, isLoading } = useQuery<Issue[]>({
    queryKey: ['issues'],
    queryFn: async () => {
      let query = supabase
        .from('issues')
        .select(`
          *,
          buildings(name),
          floors(name),
          rooms(name),
          lighting_fixtures(
            name,
            type,
            status,
            position,
            electrical_issues
          )
        `);

      if (window.location.search) {
        const params = new URLSearchParams(window.location.search);
        
        const type = params.get('type');
        if (type && type !== 'all_types') {
          query = query.eq('type', type);
        }

        if (type === 'LIGHTING') {
          const lightingType = params.get('lightingType');
          const fixtureStatus = params.get('fixtureStatus');
          const electricalIssue = params.get('electricalIssue');

          if (lightingType && lightingType !== 'all_lighting_types') {
            query = query.eq('lighting_fixtures.type', lightingType as FixtureType);
          }

          if (fixtureStatus && fixtureStatus !== 'all_fixture_statuses') {
            query = query.eq('lighting_fixtures.status', fixtureStatus as FixtureStatus);
          }

          if (electricalIssue && electricalIssue !== 'all_electrical_issues') {
            query = query.contains('lighting_fixtures.electrical_issues', { [electricalIssue]: true });
          }
        }

        const status = params.get('status');
        if (status && status !== 'all_statuses') {
          query = query.eq('status', status as IssueStatus);
        }

        const priority = params.get('priority');
        if (priority && priority !== 'all_priorities') {
          query = query.eq('priority', priority as IssuePriority);
        }

        const assignedTo = params.get('assigned_to');
        if (assignedTo && assignedTo !== 'all_assignments') {
          query = query.eq('assigned_to', assignedTo);
        }
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      
      const processedData = (data || []).map((rawIssue) => {
        const issue = rawIssue as DatabaseIssue;
        return {
          ...issue,
          lighting_fixtures: issue.lighting_fixtures?.map(fixture => ({
            name: fixture.name,
            type: fixture.type,
            status: fixture.status,
            position: fixture.position,
            electrical_issues: fixture.electrical_issues
          })) || []
        } as Issue;
      });

      return processedData;
    }
  });

  const updateIssueMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: IssueStatus }) => {
      const { error } = await supabase
        .from('issues')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success("Issue status updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update issue status");
      console.error("Error updating issue:", error);
    }
  });

  const deleteIssueMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('issues')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success("Issue deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete issue");
      console.error("Error deleting issue:", error);
    }
  });

  const handleStatusChange = (id: string, newStatus: IssueStatus) => {
    updateIssueMutation.mutate({ id, status: newStatus });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this issue?")) {
      deleteIssueMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getPriorityColor = (priority: IssuePriority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'LIGHTING':
        return {
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <AlertTriangle className="h-3 w-3 mr-1" />
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: null
        };
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues?.map((issue) => {
            const typeInfo = getTypeInfo(issue.type);
            const lightingDetails = issue.lighting_fixtures?.[0];
            
            return (
              <TableRow key={issue.id}>
                <TableCell>{issue.title}</TableCell>
                <TableCell>
                  <Badge className={`flex items-center ${typeInfo.color}`} variant="secondary">
                    {typeInfo.icon}
                    {issue.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(issue.status)} variant="secondary">
                    {issue.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getPriorityColor(issue.priority)} variant="secondary">
                    {issue.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {issue.type === 'LIGHTING' && lightingDetails ? (
                    <div className="flex flex-col">
                      <span>
                        {[
                          issue.buildings?.name,
                          issue.floors?.name,
                          lightingDetails.name
                        ].filter(Boolean).join(' > ')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {lightingDetails.type} - {lightingDetails.position}
                        {lightingDetails.electrical_issues && Object.keys(lightingDetails.electrical_issues).some(key => lightingDetails.electrical_issues[key]) && (
                          <Badge variant="destructive" className="ml-2">
                            Electrical Issues
                          </Badge>
                        )}
                      </span>
                    </div>
                  ) : (
                    <span>
                      {[
                        issue.buildings?.name,
                        issue.floors?.name,
                        issue.rooms?.name
                      ].filter(Boolean).join(' > ')}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(issue.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {issue.status !== 'in_progress' && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(issue.id, 'in_progress')}
                        >
                          Mark In Progress
                        </DropdownMenuItem>
                      )}
                      {issue.status !== 'resolved' && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(issue.id, 'resolved')}
                        >
                          Mark Resolved
                        </DropdownMenuItem>
                      )}
                      {issue.status !== 'open' && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(issue.id, 'open')}
                        >
                          Reopen Issue
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDelete(issue.id)}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
