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
import { Loader2, MoreVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  LightingFixture 
} from "./types/IssueTypes";
import { ResolutionForm } from "./forms/ResolutionForm";
import { useState } from "react";
import { IssueDetails } from "./details/IssueDetails";
import { useIsMobile } from "@/hooks/useIsMobile";
import { IssueCard } from "./card/IssueCard";
import { getTypeColor, getStatusColor, getPriorityColor } from "./utils/issueStyles";

type DatabaseIssue = {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  photos: string[];
  seen: boolean;
  buildings?: { name: string } | null;
  floors?: { name: string } | null;
  rooms?: { name: string } | null;
  lighting_fixtures?: {
    name: string;
    type: string;
    status: string;
    position: string;
    electrical_issues: any;
  } | null;
};

const isValidFixtureType = (value: string | null): value is FixtureType => {
  return value === 'standard' || value === 'emergency' || value === 'motion_sensor';
};

const isValidFixtureStatus = (value: string | null): value is FixtureStatus => {
  return ['functional', 'maintenance_needed', 'non_functional', 'pending_maintenance', 'scheduled_replacement'].includes(value || '');
};

const isValidFixturePosition = (value: string | null): value is FixturePosition => {
  return ['ceiling', 'wall', 'floor', 'desk', 'recessed'].includes(value || '');
};

const isValidIssueStatus = (value: string | null): value is IssueStatus => {
  return ['open', 'in_progress', 'resolved'].includes(value || '');
};

const isValidIssuePriority = (value: string | null): value is IssuePriority => {
  return ['high', 'medium', 'low'].includes(value || '');
};

const transformFixture = (fixtureData: DatabaseIssue['lighting_fixtures']): LightingFixture | null => {
  if (!fixtureData) return null;

  const isValid = isValidFixtureType(fixtureData.type) && 
                 isValidFixtureStatus(fixtureData.status) &&
                 isValidFixturePosition(fixtureData.position);

  if (!isValid) return null;

  return {
    name: fixtureData.name,
    type: fixtureData.type,
    status: fixtureData.status,
    position: fixtureData.position,
    electrical_issues: fixtureData.electrical_issues || {}
  };
};

const transformIssue = (dbIssue: DatabaseIssue): Issue => {
  const fixture = dbIssue.lighting_fixtures ? transformFixture(dbIssue.lighting_fixtures) : null;
  
  return {
    id: dbIssue.id,
    title: dbIssue.title,
    description: dbIssue.description,
    type: dbIssue.type,
    status: isValidIssueStatus(dbIssue.status) ? dbIssue.status : 'open',
    priority: isValidIssuePriority(dbIssue.priority) ? dbIssue.priority : 'medium',
    created_at: dbIssue.created_at,
    updated_at: dbIssue.updated_at,
    photos: dbIssue.photos || [],
    seen: dbIssue.seen,
    buildings: dbIssue.buildings,
    floors: dbIssue.floors,
    rooms: dbIssue.rooms,
    lighting_fixtures: fixture ? [fixture] : []
  };
};

export const IssuesList = () => {
  const queryClient = useQueryClient();
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const { data: issues, isLoading } = useQuery({
    queryKey: ['issues'],
    queryFn: async () => {
      const urlParams = new URLSearchParams(window.location.search);
      let query = supabase
        .from('issues')
        .select(`
          id,
          title,
          description,
          type,
          status,
          priority,
          created_at,
          updated_at,
          photos,
          seen,
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
        `)
        .order('created_at', { ascending: false });

      const typeFilter = urlParams.get('type');
      const statusFilter = urlParams.get('status');
      const priorityFilter = urlParams.get('priority');
      const assignmentFilter = urlParams.get('assigned_to');

      if (typeFilter && typeFilter !== 'all_types') {
        query = query.eq('type', typeFilter);
      }
      
      if (statusFilter && statusFilter !== 'all_statuses' && isValidIssueStatus(statusFilter)) {
        query = query.eq('status', statusFilter);
      }
      
      if (priorityFilter && priorityFilter !== 'all_priorities' && isValidIssuePriority(priorityFilter)) {
        query = query.eq('priority', priorityFilter);
      }

      if (assignmentFilter && assignmentFilter !== 'all_assignments') {
        query = query.eq('assigned_to', assignmentFilter);
      }

      if (typeFilter === 'LIGHTING') {
        const lightingType = urlParams.get('lightingType');
        const fixtureStatus = urlParams.get('fixtureStatus');
        const electricalIssue = urlParams.get('electricalIssue');

        if (lightingType && lightingType !== 'all_lighting_types') {
          query = query.contains('lighting_details', { fixture_type: lightingType });
        }
        
        if (fixtureStatus && fixtureStatus !== 'all_fixture_statuses') {
          query = query.contains('lighting_details', { fixture_status: fixtureStatus });
        }
        
        if (electricalIssue && electricalIssue !== 'all_electrical_issues') {
          query = query.contains('lighting_details->detected_issues', [electricalIssue]);
        }
      }

      const { data: queryData, error } = await query;

      if (error) throw error;
      return (queryData || []).map((item) => transformIssue(item as DatabaseIssue));
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
    if (newStatus === 'resolved') {
      setSelectedIssueId(id);
      setShowResolutionForm(true);
    } else {
      updateIssueMutation.mutate({ id, status: newStatus });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this issue?")) {
      deleteIssueMutation.mutate(id);
    }
  };

  const handleResolutionSuccess = () => {
    setShowResolutionForm(false);
    setSelectedIssueId(null);
    queryClient.invalidateQueries({ queryKey: ['issues'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {issues?.map((issue) => (
        <div key={issue.id} onClick={() => setSelectedIssueId(issue.id)}>
          <IssueCard 
            issue={issue}
            onMarkAsSeen={() => {}}
          />
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues?.map((issue) => (
            <TableRow 
              key={issue.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => setSelectedIssueId(issue.id)}
            >
              <TableCell>{issue.title}</TableCell>
              <TableCell>{issue.description}</TableCell>
              <TableCell>
                <Badge className={getTypeColor(issue.type)} variant="secondary">
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
                {[
                  issue.buildings?.name,
                  issue.floors?.name,
                  issue.rooms?.name
                ].filter(Boolean).join(' > ')}
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
                        Resolve Issue
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
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          variant={viewMode === 'cards' ? 'default' : 'outline'}
          onClick={() => setViewMode('cards')}
          className="mr-2"
        >
          Cards
        </Button>
        <Button
          variant={viewMode === 'table' ? 'default' : 'outline'}
          onClick={() => setViewMode('table')}
        >
          Table
        </Button>
      </div>

      {viewMode === 'cards' ? renderCardView() : renderTableView()}

      <IssueDetails 
        issueId={selectedIssueId} 
        onClose={() => setSelectedIssueId(null)} 
      />

      <Dialog open={showResolutionForm} onOpenChange={setShowResolutionForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Issue</DialogTitle>
          </DialogHeader>
          {selectedIssueId && (
            <ResolutionForm
              issueId={selectedIssueId}
              onSuccess={handleResolutionSuccess}
              onCancel={() => setShowResolutionForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
