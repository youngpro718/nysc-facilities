import { formatDistanceToNow } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, MapPin, User } from "lucide-react";
import type { EnhancedIssue } from "@/hooks/dashboard/useAdminIssuesData";

interface IssueTableViewProps {
  issues: EnhancedIssue[];
  selectedIssues: string[];
  onSelectionChange: (issueIds: string[]) => void;
  onIssueUpdate: () => void;
}

export function IssueTableView({ 
  issues, 
  selectedIssues, 
  onSelectionChange, 
  onIssueUpdate 
}: IssueTableViewProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(issues.map(issue => issue.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectIssue = (issueId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIssues, issueId]);
    } else {
      onSelectionChange(selectedIssues.filter(id => id !== issueId));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'secondary';
      case 'resolved': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table className="min-w-max">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIssues.length === issues.length && issues.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Reporter</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <TableRow key={issue.id}>
              <TableCell>
                <Checkbox
                  checked={selectedIssues.includes(issue.id)}
                  onCheckedChange={(checked) => handleSelectIssue(issue.id, checked as boolean)}
                />
              </TableCell>
              
              <TableCell className="max-w-xs">
                <div>
                  <div className="font-medium text-sm truncate">
                    {issue.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {issue.description}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <Badge variant={getPriorityColor(issue.priority) as any} className="text-xs">
                  {issue.priority.toUpperCase()}
                </Badge>
              </TableCell>
              
              <TableCell>
                <Badge variant={getStatusColor(issue.status) as any} className="text-xs">
                  {issue.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </TableCell>
              
              <TableCell>
                {issue.rooms ? (
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3" />
                    <span>{issue.rooms.room_number}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              
              <TableCell>
                {issue.reporter ? (
                  <div className="flex items-center gap-1 text-sm">
                    <User className="h-3 w-3" />
                    <span>{issue.reporter.first_name} {issue.reporter.last_name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              
              <TableCell className="text-sm">
                {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
              </TableCell>
              
              <TableCell className="text-sm">
                {issue.comments_count || 0}
              </TableCell>
              
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11"
                  onClick={() => console.log('View issue:', issue.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}