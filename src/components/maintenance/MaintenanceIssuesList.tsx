// @ts-nocheck
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, MapPin, Clock, CheckCircle, Search, Edit, Trash2, Camera, FileText, Wrench } from "lucide-react";
import { format } from "date-fns";

type MaintenanceIssue = {
  id: string;
  title: string;
  description: string;
  room_id?: string | null;
  issue_type: string;
  priority: string; // Using priority instead of severity
  status: string;
  notes?: string | null;
  updated_at?: string | null;
  created_at: string;
  resolved_at?: string | null;
};

export const MaintenanceIssuesList = () => {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tempFixText, setTempFixText] = useState<{[key: string]: string}>({});
  const [editingIssue, setEditingIssue] = useState<MaintenanceIssue | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: issues, isLoading, refetch } = useQuery({
    queryKey: ["maintenance-issues", statusFilter, severityFilter],
    queryFn: async () => {
      let query = supabase
        .from("issues")
        .select("*")
        .eq("issue_type", "maintenance")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        const validStatus = statusFilter as unknown;
        query = query.eq("status", validStatus);
      }
      if (severityFilter !== "all") {
        query = query.eq("priority", severityFilter as unknown);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as MaintenanceIssue[];
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
      case "critical": return "bg-red-100 dark:bg-red-900/30 text-red-800";
      case "high": return "bg-orange-100 dark:bg-orange-900/30 text-orange-800";
      case "medium": return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800";
      case "low": return "bg-green-100 dark:bg-green-900/30 text-green-800";
      default: return "bg-gray-100 dark:bg-gray-800/30 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reported": return "bg-red-100 dark:bg-red-900/30 text-red-800";
      case "in_progress": return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800";
      case "scheduled": return "bg-blue-100 dark:bg-blue-900/30 text-blue-800";
      case "resolved": return "bg-green-100 dark:bg-green-900/30 text-green-800";
      default: return "bg-gray-100 dark:bg-gray-800/30 text-gray-800";
    }
  };

  const addTemporaryFix = async (issueId: string) => {
    const fixDescription = tempFixText[issueId];
    if (!fixDescription) return;

    const { error } = await supabase
      .from("issues")
      .update({
        status: "in_progress",
        notes: `Temporary fix: ${fixDescription}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", issueId);

    if (!error) {
      toast({
        title: "Temporary fix added",
        description: "Issue marked as in progress with temporary fix",
      });
      setTempFixText(prev => ({ ...prev, [issueId]: "" }));
      refetch();
    } else {
      toast({
        title: "Error",
        description: "Failed to add temporary fix",
        variant: "destructive",
      });
    }
  };

  const markResolved = async (issueId: string) => {
    const { error } = await supabase
      .from("issues")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", issueId);

    if (!error) {
      toast({
        title: "Issue resolved",
        description: "Maintenance issue marked as resolved",
      });
      refetch();
    } else {
      toast({
        title: "Error",
        description: "Failed to mark issue as resolved",
        variant: "destructive",
      });
    }
  };

  const deleteIssue = async (id: string) => {
    const { error } = await supabase
      .from("issues")
      .delete()
      .eq("id", id);

    if (!error) {
      toast({
        title: "Deleted",
        description: "Maintenance issue deleted successfully",
      });
      setDeletingId(null);
      refetch();
    } else {
      toast({
        title: "Error",
        description: "Failed to delete issue",
        variant: "destructive",
      });
    }
  };

  const saveIssue = async () => {
    if (!editingIssue) return;

    const { error } = await supabase
      .from("issues")
      .update({
        title: editingIssue.title,
        description: editingIssue.description,
        priority: editingIssue.priority,
        issue_type: editingIssue.issue_type,
      })
      .eq("id", editingIssue.id);

    if (!error) {
      toast({
        title: "Saved",
        description: "Maintenance issue updated successfully",
      });
      setEditingIssue(null);
      refetch();
    } else {
      toast({
        title: "Error",
        description: "Failed to update issue",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Filter issues by search query
  const filteredIssues = issues?.filter(issue => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      issue.title.toLowerCase().includes(query) ||
      issue.description.toLowerCase().includes(query) ||
      issue.issue_type.toLowerCase().includes(query) ||
      issue.notes?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="reported">Reported</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredIssues?.map((issue) => (
          <Card key={issue.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    {issue.title}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    {issue.room_id && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Room ID: {issue.room_id}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(issue.created_at), "MMM dd, yyyy")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(issue.priority)}>
                    {issue.priority}
                  </Badge>
                  <Badge className={getStatusColor(issue.status)}>
                    {issue.status.replace("_", " ")}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingIssue(issue)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeletingId(issue.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm">{issue.description}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <strong>Issue Type:</strong> <span className="capitalize">{issue.issue_type}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    {((issue as Record<string, unknown>)).photos && ((issue as Record<string, unknown>)).photos.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Camera className="h-4 w-4" />
                        <span className="text-xs">{((issue as Record<string, unknown>)).photos.length}</span>
                      </div>
                    )}
                    {((issue as Record<string, unknown>)).attachments && ((issue as Record<string, unknown>)).attachments.length > 0 && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span className="text-xs">{((issue as Record<string, unknown>)).attachments.length}</span>
                      </div>
                    )}
                  </div>
                </div>

                {issue.notes && issue.notes.startsWith('Temporary fix:') && (
                  <div className="bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800 font-medium">
                      <CheckCircle className="h-4 w-4" />
                      Temporary Fix Applied
                    </div>
                    <p className="text-sm mt-1 text-yellow-700 dark:text-yellow-400">{issue.notes.replace('Temporary fix: ', '')}</p>
                    {issue.updated_at && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        Applied on {format(new Date(issue.updated_at), "MMM dd, yyyy")}
                      </p>
                    )}
                  </div>
                )}


                {issue.status === "open" && (
                  <div className="space-y-2 pt-2">
                    <Textarea
                      placeholder="Describe temporary fix..."
                      value={tempFixText[issue.id] || ""}
                      onChange={(e) => setTempFixText(prev => ({
                        ...prev,
                        [issue.id]: e.target.value
                      }))}
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => addTemporaryFix(issue.id)}
                        disabled={!tempFixText[issue.id]}
                      >
                        Add Temporary Fix
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => markResolved(issue.id)}
                      >
                        Mark as Resolved
                      </Button>
                    </div>
                  </div>
                )}

                {issue.status === "in_progress" && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => markResolved(issue.id)}
                    >
                      Mark as Resolved
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredIssues?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No matches found' : 'No maintenance issues'}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {searchQuery 
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'All maintenance issues have been resolved. Great work!'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Maintenance Issue</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this maintenance issue? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteIssue(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingIssue} onOpenChange={() => setEditingIssue(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Maintenance Issue</DialogTitle>
            <DialogDescription>
              Update the maintenance issue details below.
            </DialogDescription>
          </DialogHeader>
          {editingIssue && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={editingIssue.title}
                  onChange={(e) => setEditingIssue({ ...editingIssue, title: e.target.value })}
                  placeholder="e.g., Broken AC Unit"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingIssue.description}
                  onChange={(e) => setEditingIssue({ ...editingIssue, description: e.target.value })}
                  placeholder="Detailed description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={editingIssue.priority}
                    onValueChange={(value) => setEditingIssue({ ...editingIssue, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Issue Type</Label>
                  <Input
                    id="type"
                    value={editingIssue.issue_type}
                    onChange={(e) => setEditingIssue({ ...editingIssue, issue_type: e.target.value })}
                    placeholder="e.g., electrical"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingIssue(null)}>Cancel</Button>
            <Button onClick={saveIssue}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};