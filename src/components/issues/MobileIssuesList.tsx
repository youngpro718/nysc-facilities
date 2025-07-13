import { useState, useMemo } from "react";
import { MobileSearchBar } from "@/components/mobile/MobileSearchBar";
import { MobileIssueFilters } from "./MobileIssueFilters";
import { MobileIssueCard } from "./MobileIssueCard";
import { MobileDetailsDialog } from "@/components/mobile/MobileDetailsDialog";
import { Issue } from "./types/IssueTypes";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIssueQueries } from "./hooks/useIssueQueries";

interface MobileIssuesListProps {
  onCreateIssue: () => void;
}

export function MobileIssuesList({ onCreateIssue }: MobileIssuesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const [filters, setFilters] = useState({
    type: 'all_types' as const,
    status: 'all_statuses' as const,
    priority: 'all_priorities' as const,
    assigned_to: 'all_assignments' as const,
    sortBy: 'created_at',
    order: 'desc' as const
  });

  // Mock data for now - replace with actual hook
  const { issues, isLoading } = useIssueQueries({
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

  const filteredIssues = useMemo(() => {
    if (!issues) return [];
    
    return issues.filter(issue => {
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!issue.title.toLowerCase().includes(query) &&
            !issue.description.toLowerCase().includes(query) &&
            !issue.type.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Apply filters
      if (filters.status.length > 0 && !filters.status.includes(issue.status)) {
        return false;
      }
      
      if (filters.priority.length > 0 && !filters.priority.includes(issue.priority)) {
        return false;
      }
      
      return true;
    });
  }, [issues, searchQuery, filters]);

  const handleIssueView = (issue: Issue) => {
    setSelectedIssue(issue);
    setDetailsOpen(true);
  };

  const handleIssueEdit = (issue: Issue) => {
    // TODO: Open edit dialog
    console.log('Edit issue:', issue.id);
  };

  const handleIssueAssign = (issue: Issue) => {
    // TODO: Open assign dialog
    console.log('Assign issue:', issue.id);
  };

  const handleIssueResolve = (issue: Issue) => {
    // TODO: Resolve issue
    console.log('Resolve issue:', issue.id);
  };

  const handleIssueClose = (issue: Issue) => {
    // TODO: Close issue
    console.log('Close issue:', issue.id);
  };

  const handleIssueComment = (issue: Issue) => {
    // TODO: Open comment dialog
    console.log('Comment on issue:', issue.id);
  };

  const getActiveFilterCount = () => {
    return filters.status.length + filters.priority.length + filters.category.length + filters.assignee.length;
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
              categories={categories}
              assignees={assignees}
            />
            
            {/* Quick filter badges */}
            <div className="flex gap-1 overflow-x-auto">
              <Badge 
                variant="outline" 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setFilters(f => ({ ...f, status: ['open'] }))}
              >
                Open
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setFilters(f => ({ ...f, priority: ['high'] }))}
              >
                High Priority
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setFilters(f => ({ ...f, assignee: ['current-user'] }))}
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
          description={`${selectedIssue.type} • ${selectedIssue.status}`}
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
          </div>
        </MobileDetailsDialog>
      )}
    </div>
  );
}