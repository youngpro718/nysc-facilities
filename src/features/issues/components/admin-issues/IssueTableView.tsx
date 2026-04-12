import { formatDistanceToNow } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { IssueTypeBadge } from "@features/issues/components/issues/card/IssueTypeBadge";
import { DeleteIssueButton } from "@features/issues/components/issues/components/DeleteIssueButton";
import type { EnhancedIssue } from "@features/dashboard/hooks/useAdminIssuesData";

function getIssueAge(createdAt: string): { label: string; urgency: 'normal' | 'warning' | 'critical' } {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.floor(diffHours / 24);

  let label: string;
  if (diffHours < 1) label = 'Just now';
  else if (diffHours < 24) label = `${Math.floor(diffHours)}h`;
  else if (diffDays < 7) label = `${diffDays}d`;
  else if (diffDays < 30) label = `${Math.floor(diffDays / 7)}w`;
  else label = `${Math.floor(diffDays / 30)}mo`;

  const urgency = diffDays > 7 ? 'critical' : diffDays > 3 ? 'warning' : 'normal';
  return { label, urgency };
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface IssueTableViewProps {
  issues: EnhancedIssue[];
  selectedIssues: string[];
  onSelectionChange: (issueIds: string[]) => void;
  onIssueUpdate: () => void;
  onIssueSelect?: (issueId: string) => void;
}

export function IssueTableView({
  issues,
  selectedIssues,
  onSelectionChange,
  onIssueUpdate,
  onIssueSelect
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

  const getPriorityColor = (priority: string): BadgeVariant => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string): BadgeVariant => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'secondary';
      case 'resolved': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table className="min-w-[980px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIssues.length === issues.length && issues.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="min-w-[260px]">Title</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="min-w-[110px]">Room</TableHead>
            <TableHead className="min-w-[160px]">Reporter</TableHead>
            <TableHead className="min-w-[120px]">Created</TableHead>
            <TableHead className="min-w-[90px]">Comments</TableHead>
            <TableHead className="w-32">Actions</TableHead>
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

              <TableCell className="max-w-sm">
                <button
                  className="text-left w-full hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1 py-0.5 -mx-1 -my-0.5"
                  onClick={() => onIssueSelect?.(issue.id)}
                >
                  <div className="font-medium text-sm truncate">
                    {issue.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {issue.description}
                  </div>
                </button>
              </TableCell>

              <TableCell>
                <Badge variant={getPriorityColor(issue.priority)} className="text-xs">
                  {issue.priority.toUpperCase()}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge variant={getStatusColor(issue.status)} className="text-xs">
                  {issue.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </TableCell>

              <TableCell>
                {issue.status === 'resolved' ? (
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(issue.updated_at || issue.created_at), { addSuffix: true })}
                  </span>
                ) : (() => {
                  const age = getIssueAge(issue.created_at);
                  return (
                    <span className={cn(
                      "text-xs font-medium",
                      age.urgency === 'critical' && "text-red-500",
                      age.urgency === 'warning' && "text-amber-500",
                      age.urgency === 'normal' && "text-muted-foreground",
                    )}>
                      {age.urgency === 'critical' && '● '}
                      {age.label}
                    </span>
                  );
                })()}
              </TableCell>

              <TableCell>
                <IssueTypeBadge issueType={issue.issue_type} className="text-[10px] whitespace-nowrap" />
                {(!issue.issue_type || issue.issue_type === 'general') && (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
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
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onIssueSelect?.(issue.id)}
                    title="View issue details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <DeleteIssueButton
                    issueId={issue.id}
                    standalone={false}
                    onDelete={onIssueUpdate}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}