import { useState } from "react";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Tool, 
  User, 
  Calendar,
  AlertTriangle
} from "lucide-react";
import { WorkAssignment } from "../types/relocationTypes";
import { useRelocations } from "../hooks/useRelocations";
import { Progress } from "@/components/ui/progress";

interface WorkAssignmentDetailsProps {
  relocationId: string;
  workAssignments: WorkAssignment[];
}

export function WorkAssignmentDetails({ relocationId, workAssignments }: WorkAssignmentDetailsProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<WorkAssignment | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { updateWorkAssignmentStatus, isUpdatingWorkAssignment } = useRelocations();
  
  const handleMarkComplete = async () => {
    if (!selectedAssignment) return;
    
    await updateWorkAssignmentStatus({
      relocationId,
      workAssignmentId: selectedAssignment.id,
      status: "completed",
      completionNotes
    });
    
    setDialogOpen(false);
    setCompletionNotes("");
  };
  
  const handleMarkInProgress = async (assignment: WorkAssignment) => {
    await updateWorkAssignmentStatus({
      relocationId,
      workAssignmentId: assignment.id,
      status: "in_progress"
    });
  };
  
  // Calculate completion percentage
  const completedCount = workAssignments.filter(a => a.status === "completed").length;
  const totalCount = workAssignments.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  // Group assignments by status
  const groupedAssignments = {
    scheduled: workAssignments.filter(a => a.status === "scheduled"),
    in_progress: workAssignments.filter(a => a.status === "in_progress"),
    completed: workAssignments.filter(a => a.status === "completed")
  };
  
  // Format time for display
  const formatTimeRange = (startTime: string, endTime: string) => {
    // Convert 24-hour format to 12-hour format
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}${minutes !== '00' ? ':' + minutes : ''} ${ampm}`;
    };
    
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };
  
  // Render assignment card based on status
  const renderAssignmentCard = (assignment: WorkAssignment) => {
    const isPastDue = new Date(assignment.work_date) < new Date() && assignment.status !== "completed";
    
    return (
      <Card 
        key={assignment.id} 
        className={`
          ${assignment.status === "completed" ? "border-green-200 bg-green-50 dark:bg-green-900/10" : ""}
          ${assignment.status === "in_progress" ? "border-blue-200 bg-blue-50 dark:bg-blue-900/10" : ""}
          ${isPastDue && assignment.status !== "completed" ? "border-red-200" : ""}
        `}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">{assignment.work_description}</h4>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <User className="h-3 w-3" />
                <span>{assignment.worker_name}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(assignment.work_date), "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>{formatTimeRange(assignment.start_time, assignment.end_time)}</span>
              </div>
              {assignment.priority === "high" && (
                <Badge variant="outline" className="mt-2 bg-amber-100 text-amber-800 border-amber-200">
                  High Priority
                </Badge>
              )}
              {isPastDue && assignment.status !== "completed" && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-2">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Past due</span>
                </div>
              )}
            </div>
            
            <div>
              {assignment.status === "completed" ? (
                <Badge className="bg-green-500">Completed</Badge>
              ) : assignment.status === "in_progress" ? (
                <Badge className="bg-blue-500">In Progress</Badge>
              ) : (
                <Badge variant="outline">Scheduled</Badge>
              )}
            </div>
          </div>
          
          {assignment.completion_notes && (
            <div className="mt-3 p-2 bg-background rounded-md text-sm">
              <p className="font-medium text-xs text-muted-foreground mb-1">Completion Notes:</p>
              <p>{assignment.completion_notes}</p>
            </div>
          )}
          
          <div className="mt-3 flex justify-end gap-2">
            {assignment.status === "scheduled" && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleMarkInProgress(assignment)}
              >
                <Clock className="h-3 w-3 mr-1" />
                Start Work
              </Button>
            )}
            
            {(assignment.status === "scheduled" || assignment.status === "in_progress") && (
              <Button 
                size="sm"
                onClick={() => {
                  setSelectedAssignment(assignment);
                  setDialogOpen(true);
                }}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark Complete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  if (workAssignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Work Assignments</CardTitle>
          <CardDescription>
            No work assignments have been created for this relocation yet
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex justify-center">
          <div className="text-center">
            <Tool className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Create work assignments to track renovation progress
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Work Assignments</CardTitle>
              <CardDescription>
                {workAssignments.length} work {workAssignments.length === 1 ? 'assignment' : 'assignments'} for this relocation
              </CardDescription>
            </div>
            <Badge variant={completionPercentage === 100 ? "default" : "outline"}>
              {completionPercentage}% Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="h-2 mb-6" />
          
          <div className="space-y-6">
            {groupedAssignments.in_progress.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-blue-500" />
                  In Progress ({groupedAssignments.in_progress.length})
                </h3>
                <div className="space-y-3">
                  {groupedAssignments.in_progress.map(renderAssignmentCard)}
                </div>
              </div>
            )}
            
            {groupedAssignments.scheduled.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  Scheduled ({groupedAssignments.scheduled.length})
                </h3>
                <div className="space-y-3">
                  {groupedAssignments.scheduled.map(renderAssignmentCard)}
                </div>
              </div>
            )}
            
            {groupedAssignments.completed.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Completed ({groupedAssignments.completed.length})
                </h3>
                <div className="space-y-3">
                  {groupedAssignments.completed.map(renderAssignmentCard)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Work Assignment as Complete</DialogTitle>
            <DialogDescription>
              Add any notes about the completion of this work assignment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder="Enter any notes about the completed work..."
              className="min-h-[100px]"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleMarkComplete}
              disabled={isUpdatingWorkAssignment}
            >
              {isUpdatingWorkAssignment ? "Saving..." : "Mark Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
