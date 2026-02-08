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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, User, Clock, AlertCircle, Search, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

type MaintenanceSchedule = {
  id: string;
  title: string;
  description: string | null;
  maintenance_type: string;
  scheduled_start_date: string;
  scheduled_end_date: string | null;
  status: string;
  priority: string;
  notes: string | null;
  estimated_cost: number | null;
  space_id?: string | null;
  assigned_to?: string | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
};

export const MaintenanceScheduleList = () => {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: schedules, isLoading, refetch } = useQuery({
    queryKey: ["maintenance-schedules", statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("maintenance_schedules")
        .select("*")
        .order("scheduled_start_date", { ascending: true });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (typeFilter !== "all") {
        query = query.eq("maintenance_type", typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MaintenanceSchedule[];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 dark:bg-blue-900/30 text-blue-800";
      case "in_progress": return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800";
      case "completed": return "bg-green-100 dark:bg-green-900/30 text-green-800";
      case "postponed": return "bg-orange-100 dark:bg-orange-900/30 text-orange-800";
      case "cancelled": return "bg-red-100 dark:bg-red-900/30 text-red-800";
      default: return "bg-gray-100 dark:bg-gray-800/30 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 dark:bg-red-900/30 text-red-800";
      case "high": return "bg-orange-100 dark:bg-orange-900/30 text-orange-800";
      case "medium": return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800";
      case "low": return "bg-green-100 dark:bg-green-900/30 text-green-800";
      default: return "bg-gray-100 dark:bg-gray-800/30 text-gray-800";
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const updates: Record<string, unknown> = { status: newStatus };
    
    if (newStatus === "in_progress" && !schedules?.find(s => s.id === id)?.scheduled_start_date) {
      updates.actual_start_date = new Date().toISOString();
    }
    if (newStatus === "completed") {
      updates.actual_end_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from("maintenance_schedules")
      .update(updates)
      .eq("id", id);

    if (!error) {
      toast({
        title: "Status updated",
        description: `Maintenance schedule marked as ${newStatus.replace('_', ' ')}`,
      });
      refetch();
    } else {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const deleteSchedule = async (id: string) => {
    const { error } = await supabase
      .from("maintenance_schedules")
      .delete()
      .eq("id", id);

    if (!error) {
      toast({
        title: "Deleted",
        description: "Maintenance schedule deleted successfully",
      });
      setDeletingId(null);
      refetch();
    } else {
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive",
      });
    }
  };

  const saveSchedule = async () => {
    if (!editingSchedule) return;

    const { error } = await supabase
      .from("maintenance_schedules")
      .update({
        title: editingSchedule.title,
        description: editingSchedule.description,
        maintenance_type: editingSchedule.maintenance_type,
        status: editingSchedule.status,
        priority: editingSchedule.priority,
        notes: editingSchedule.notes,
      })
      .eq("id", editingSchedule.id);

    if (!error) {
      toast({
        title: "Saved",
        description: "Maintenance schedule updated successfully",
      });
      setEditingSchedule(null);
      refetch();
    } else {
      toast({
        title: "Error",
        description: "Failed to update schedule",
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

  // Filter schedules by search query
  const filteredSchedules = schedules?.filter(schedule => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      schedule.title.toLowerCase().includes(query) ||
      schedule.description?.toLowerCase().includes(query) ||
      schedule.maintenance_type.toLowerCase().includes(query) ||
      schedule.notes?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search maintenance..."
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
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="postponed">Postponed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="painting">Painting</SelectItem>
            <SelectItem value="flooring">Flooring</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
            <SelectItem value="hvac">HVAC</SelectItem>
            <SelectItem value="plumbing">Plumbing</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredSchedules?.map((schedule) => (
          <Card key={schedule.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{schedule.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    {schedule.space_id && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Space ID: {schedule.space_id}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(schedule.scheduled_start_date), "MMM dd, yyyy")}
                      {schedule.scheduled_end_date && 
                        ` - ${format(new Date(schedule.scheduled_end_date), "MMM dd, yyyy")}`
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(schedule.priority)}>
                    {schedule.priority}
                  </Badge>
                  <Badge className={getStatusColor(schedule.status)}>
                    {schedule.status.replace("_", " ")}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingSchedule(schedule)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeletingId(schedule.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schedule.description && (
                  <p className="text-sm text-muted-foreground">{schedule.description}</p>
                )}
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span className="capitalize">{schedule.maintenance_type}</span>
                  </div>
                  {schedule.estimated_cost && (
                    <span className="text-green-600 dark:text-green-400">
                      Est. ${schedule.estimated_cost.toLocaleString()}
                    </span>
                  )}
                </div>

                {schedule.notes && (
                  <div className="text-sm">
                    <strong>Notes:</strong> {schedule.notes}
                  </div>
                )}

                {schedule.status === "scheduled" && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => updateStatus(schedule.id, "in_progress")}
                    >
                      Start Maintenance
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateStatus(schedule.id, "postponed")}
                    >
                      Postpone
                    </Button>
                  </div>
                )}

                {schedule.status === "in_progress" && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => updateStatus(schedule.id, "completed")}
                    >
                      Mark Complete
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSchedules?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No matches found' : 'No scheduled maintenance'}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {searchQuery 
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'No maintenance tasks are currently scheduled. Click "Schedule Maintenance" to add one.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Maintenance Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this maintenance schedule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteSchedule(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingSchedule} onOpenChange={() => setEditingSchedule(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Maintenance: {editingSchedule?.title}</DialogTitle>
            <DialogDescription>
              Update maintenance details and track progress
            </DialogDescription>
          </DialogHeader>
          {editingSchedule && (
            <div className="space-y-4">
              {/* Title and Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={editingSchedule.title}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, title: e.target.value })}
                    placeholder="e.g., Part 59 waxing"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={editingSchedule.maintenance_type}
                    onValueChange={(value) => setEditingSchedule({ ...editingSchedule, maintenance_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="painting">Painting</SelectItem>
                      <SelectItem value="flooring">Flooring</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="hvac">HVAC</SelectItem>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">What needs to be done?</Label>
                <Textarea
                  id="description"
                  value={editingSchedule.description || ""}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, description: e.target.value })}
                  placeholder="Describe the work to be performed..."
                  rows={3}
                />
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editingSchedule.status}
                    onValueChange={(value) => setEditingSchedule({ ...editingSchedule, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="postponed">Postponed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={editingSchedule.priority}
                    onValueChange={(value) => setEditingSchedule({ ...editingSchedule, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Updates</Label>
                <Textarea
                  id="notes"
                  value={editingSchedule.notes || ""}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, notes: e.target.value })}
                  placeholder="Add any updates, issues, or important information..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSchedule(null)}>Cancel</Button>
            <Button onClick={saveSchedule}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};