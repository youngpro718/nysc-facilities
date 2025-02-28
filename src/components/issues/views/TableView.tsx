
import { format } from "date-fns";
import { MoreVertical } from "lucide-react";
import { Issue, IssueStatus } from "../types/IssueTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTypeColor, getStatusColor, getPriorityColor } from "../utils/issueStyles";

interface TableViewProps {
  issues: Issue[];
  onIssueSelect: (id: string) => void;
  onStatusChange: (id: string, status: IssueStatus) => void;
  onDelete: (id: string) => void;
}

export const TableView = ({ 
  issues, 
  onIssueSelect, 
  onStatusChange, 
  onDelete 
}: TableViewProps) => {
  const handleActionClick = (
    e: React.MouseEvent, 
    action: (id: string) => void, 
    id: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Use a small delay to ensure event propagation is complete
    // before running the action
    setTimeout(() => {
      action(id);
    }, 10);
  };

  return (
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
              onClick={(e) => {
                e.preventDefault();
                handleActionClick(e, onIssueSelect, issue.id);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onIssueSelect(issue.id);
                }
              }}
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
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation(); // Prevent triggering row click
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    {issue.status !== 'in_progress' && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          handleActionClick(e, (id) => onStatusChange(id, 'in_progress'), issue.id);
                        }}
                      >
                        Mark In Progress
                      </DropdownMenuItem>
                    )}
                    {issue.status !== 'resolved' && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          handleActionClick(e, (id) => onStatusChange(id, 'resolved'), issue.id);
                        }}
                      >
                        Resolve Issue
                      </DropdownMenuItem>
                    )}
                    {issue.status !== 'open' && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          handleActionClick(e, (id) => onStatusChange(id, 'open'), issue.id);
                        }}
                      >
                        Reopen Issue
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={(e) => {
                        handleActionClick(e, onDelete, issue.id);
                      }}
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
};
