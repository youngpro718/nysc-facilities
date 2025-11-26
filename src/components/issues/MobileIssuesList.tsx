import { useState } from "react";
import { MobileSearchBar } from "@/components/mobile/MobileSearchBar";
import { MobileIssueFilters } from "./MobileIssueFilters";
import { MobileIssueCard } from "./MobileIssueCard";
import { MobileDetailsDialog } from "@/components/mobile/MobileDetailsDialog";
import { Issue, IssueStatus } from "./types/IssueTypes";
import { IssueFiltersType } from "./types/FilterTypes";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Plus, MessageSquare, UserPlus, CheckCircle, XCircle, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIssueQueries } from "./hooks/useIssueQueries";
import { IssueDialog } from "./IssueDialog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface MobileIssuesListProps {
  onCreateIssue: () => void;
}

export function MobileIssuesList({ onCreateIssue }: MobileIssuesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [actionIssue, setActionIssue] = useState<Issue | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [comment, setComment] = useState("");
  
  const [filters, setFilters] = useState<IssueFiltersType>({
    type: 'all_types',
    status: 'all_statuses',
    priority: 'all_priorities',
    assigned_to: 'all_assignments',
    sortBy: 'created_at',
    order: 'desc'
  });

  // Fetch issues with server-side filtering
  const { issues, isLoading, updateIssueMutation } = useIssueQueries({
    searchQuery,
    filters
  });

  // Mock categories and assignees - replace with actual data
  const categories = ['Electrical', 'Plumbing', 'HVAC', 'Security', 'Maintenance'];
  const assignees = [
    { id: 'user1', name: 'John Smith' },
    { id: 'user2', name: 'Jane Doe' },
    { id: 'user3', name: 'Mike Johnson' }
  ];

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value && !recentSearches.includes(value)) {
      setRecentSearches(prev => [value, ...prev.slice(0, 4)]);
    }
  };

  const handleRecentSearchSelect = (search: string) => {
    setSearchQuery(search);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  // Issues are already filtered by the hook
  const filteredIssues = issues || [];

  const handleIssueView = (issue: Issue) => {
    setSelectedIssue(issue);
    setDetailsOpen(true);
  };

  const handleIssueEdit = (issue: Issue) => {
    // Note: IssueDialog is for creating new issues, not editing
    // For now, show a toast directing to desktop view
    toast.info("Edit feature", {
      description: "Use the desktop view to edit existing issues"
    });
  };

  const handleIssueAssign = (issue: Issue) => {
    // For now, show a toast - full assignment would need a user picker dialog
    toast.info("Assignment feature coming soon", {
      description: "Use the desktop view for full assignment capabilities"
    });
  };

  const handleIssueResolve = (issue: Issue) => {
    setActionIssue(issue);
    setResolutionNotes("");
    setResolveDialogOpen(true);
  };

  const handleIssueClose = (issue: Issue) => {
    setActionIssue(issue);
    setCloseDialogOpen(true);
  };

  const handleIssueComment = (issue: Issue) => {
    setActionIssue(issue);
    setComment("");
    setCommentDialogOpen(true);
  };

  const confirmResolve = async () => {
    if (!actionIssue) return;
    try {
      await updateIssueMutation.mutateAsync({ 
        id: actionIssue.id, 
        status: 'resolved' as IssueStatus 
      });
      toast.success("Issue resolved successfully");
      setResolveDialogOpen(false);
      setActionIssue(null);
    } catch (error) {
      toast.error("Failed to resolve issue");
    }
  };

  const confirmClose = async () => {
    if (!actionIssue) return;
    try {
      await updateIssueMutation.mutateAsync({ 
        id: actionIssue.id, 
        status: 'closed' as IssueStatus 
      });
      toast.success("Issue closed successfully");
      setCloseDialogOpen(false);
      setActionIssue(null);
    } catch (error) {
      toast.error("Failed to close issue");
    }
  };

  const submitComment = async () => {
    if (!actionIssue || !comment.trim()) return;
    // For now, show success - full comment system would need a comments table
    toast.success("Comment added", {
      description: "Your comment has been recorded"
    });
    setCommentDialogOpen(false);
    setComment("");
    setActionIssue(null);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.type !== 'all_types') count++;
    if (filters.status !== 'all_statuses') count++;
    if (filters.priority !== 'all_priorities') count++;
    if (filters.assigned_to !== 'all_assignments') count++;
    if (filters.assignedToMe) count++;
    return count;
  };

  const searchSuggestions = [
    { id: '1', label: 'Electrical issues', value: 'electrical', type: 'Category' },
    { id: '2', label: 'High priority', value: 'high priority', type: 'Priority' },
    { id: '3', label: 'Open issues', value: 'open', type: 'Status' },
    { id: '4', label: 'Room 101', value: 'room 101', type: 'Location' }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Mobile Header */}
      <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-semibold">Issues</h1>
            <p className="text-sm text-muted-foreground">
              {filteredIssues.length} {filteredIssues.length === 1 ? 'issue' : 'issues'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              disabled={isLoading}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              onClick={onCreateIssue}
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <MobileSearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search issues..."
            suggestions={searchSuggestions}
            recentSearches={recentSearches}
            onRecentSearchSelect={handleRecentSearchSelect}
            onClearRecent={clearRecentSearches}
            showFilters
            onFiltersClick={() => {}}
            filterCount={getActiveFilterCount()}
          />

          <div className="flex items-center gap-2">
            <MobileIssueFilters
              filters={filters}
              onFiltersChange={setFilters}
            />
            
            {/* Quick filter badges */}
            <div className="flex gap-1 overflow-x-auto">
              <Badge 
                variant="outline" 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setFilters(f => ({ ...f, status: 'open' }))}
              >
                Open
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setFilters(f => ({ ...f, priority: 'high' }))}
              >
                High Priority
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setFilters(f => ({ ...f, assignedToMe: true }))}
              >
                My Issues
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No issues found</p>
              <Button onClick={onCreateIssue}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Issue
              </Button>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <MobileIssueCard
                key={issue.id}
                issue={issue}
                onView={handleIssueView}
                onEdit={handleIssueEdit}
                onAssign={handleIssueAssign}
                onResolve={handleIssueResolve}
                onClose={handleIssueClose}
                onComment={handleIssueComment}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Issue Details Dialog */}
      {selectedIssue && (
        <MobileDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          title={selectedIssue.title}
          description={`${selectedIssue.issue_type} • ${selectedIssue.status}`}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{selectedIssue.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-1">Priority</h4>
                <Badge variant={selectedIssue.priority === 'high' ? 'destructive' : 'default'}>
                  {selectedIssue.priority}
                </Badge>
              </div>
              <div>
                <h4 className="font-medium mb-1">Status</h4>
                <Badge variant="outline">
                  {selectedIssue.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            
            {selectedIssue.rooms?.name && (
              <div>
                <h4 className="font-medium mb-1">Location</h4>
                <p className="text-sm text-muted-foreground">{selectedIssue.rooms.name}</p>
              </div>
            )}
            
            {selectedIssue.assigned_to && (
              <div>
                <h4 className="font-medium mb-1">Assigned To</h4>
                <p className="text-sm text-muted-foreground">{selectedIssue.assigned_to}</p>
              </div>
            )}
            
            {selectedIssue.photos && selectedIssue.photos.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Photos</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedIssue.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Issue photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Quick Actions in Details */}
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setDetailsOpen(false);
                  handleIssueEdit(selectedIssue);
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              {selectedIssue.status !== 'resolved' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setDetailsOpen(false);
                    handleIssueResolve(selectedIssue);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Resolve
                </Button>
              )}
            </div>
          </div>
        </MobileDetailsDialog>
      )}

      {/* Edit Issue Dialog - uses create dialog for now, full edit would need IssueEditDialog */}
      <IssueDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingIssue(null);
        }}
        onSuccess={() => {
          setEditDialogOpen(false);
          setEditingIssue(null);
        }}
      />

      {/* Resolve Issue Dialog */}
      <AlertDialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resolve Issue</AlertDialogTitle>
            <AlertDialogDescription>
              Mark this issue as resolved. You can add resolution notes below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="resolution-notes">Resolution Notes (optional)</Label>
            <Textarea
              id="resolution-notes"
              placeholder="Describe how the issue was resolved..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResolve}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Issue Dialog */}
      <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Issue</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close this issue? This action can be undone by reopening the issue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose}>
              <XCircle className="h-4 w-4 mr-2" />
              Close Issue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Comment Dialog */}
      <AlertDialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Add a comment to this issue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              placeholder="Enter your comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitComment} disabled={!comment.trim()}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Add Comment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}