import { useState } from "react";
import { format, parseISO, isToday, isTomorrow, isBefore } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Hammer, Check, Clock, AlertCircle, X, Calendar, Users } from "lucide-react";
import { WorkAssignment, WorkAssignmentStatus } from "../types/relocationTypes";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WorkAssignmentsListProps {
  workAssignments: WorkAssignment[];
  onUpdateStatus: (
    relocationId: string,
    workAssignmentId: string,
    status: WorkAssignmentStatus,
    notes?: string
  ) => void;
  onViewDetails?: (workAssignment: WorkAssignment) => void;
}

export function WorkAssignmentsList({
  workAssignments,
  onUpdateStatus,
  onViewDetails
}: WorkAssignmentsListProps) {
  const [selectedTab, setSelectedTab] = useState("all");
  const [completionNotes, setCompletionNotes] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<WorkAssignment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filter assignments based on selected tab
  const filteredAssignments = workAssignments.filter(assignment => {
    if (selectedTab === "all") return true;
    if (selectedTab === "today") return isToday(parseISO(assignment.date));
    if (selectedTab === "scheduled") return assignment.status === "scheduled";
    if (selectedTab === "in-progress") return assignment.status === "in_progress";
    if (selectedTab === "completed") return assignment.status === "completed";
    return true;
  });

  // Sort assignments by date and time
  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    const dateA = parseISO(a.date);
    const dateB = parseISO(b.date);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    return a.start_time.localeCompare(b.start_time);
  });

  // Handle status update
  const handleStatusUpdate = (status: WorkAssignmentStatus) => {
    if (!selectedAssignment) return;
    
    onUpdateStatus(
      selectedAssignment.relocation_id,
      selectedAssignment.id,
      status,
      status === "completed" ? completionNotes : undefined
    );
    
    setCompletionNotes("");
    setIsDialogOpen(false);
    setSelectedAssignment(null);
  };

  // Prepare to update status
  const prepareUpdateStatus = (assignment: WorkAssignment, status: WorkAssignmentStatus) => {
    setSelectedAssignment(assignment);
    
    // If marking as completed, show dialog for notes
    if (status === "completed") {
      setIsDialogOpen(true);
    } else {
      // Otherwise, update immediately
      onUpdateStatus(assignment.relocation_id, assignment.id, status);
    }
  };

  // Get appropriate status icon
  const getStatusIcon = (status: WorkAssignmentStatus) => {
    switch (status) {
      case "scheduled":
        return <Calendar className="h-4 w-4 text-muted-foreground" />;
      case "in_progress":
        return <Hammer className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <Check className="h-4 w-4 text-green-500" />;
      case "cancelled":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Get appropriate date badge
  const getDateBadge = (date: string) => {
    const parsedDate = parseISO(date);
    
    if (isToday(parsedDate)) {
      return <Badge className="bg-green-500">Today</Badge>;
    }
    
    if (isTomorrow(parsedDate)) {
      return <Badge variant="outline" className="border-blue-500 text-blue-500">Tomorrow</Badge>;
    }
    
    if (isBefore(parsedDate, new Date()) && !isToday(parsedDate)) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    
    return <Badge variant="outline">{format(parsedDate, "MMM d")}</Badge>;
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value={selectedTab} className="mt-4">
          {sortedAssignments.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Work Assignments Found</CardTitle>
                <CardDescription>
                  {selectedTab === "all" 
                    ? "There are no work assignments in the system."
                    : `There are no ${selectedTab} work assignments.`}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-3">
                {sortedAssignments.map(assignment => (
                  <Card key={assignment.id} className="relative">
                    {/* Status indicator */}
                    <div className="absolute top-0 bottom-0 left-0 w-1.5 rounded-l-lg" 
                      style={{ 
                        backgroundColor: 
                          assignment.status === "completed" ? "#10b981" : 
                          assignment.status === "in_progress" ? "#3b82f6" : 
                          assignment.status === "cancelled" ? "#ef4444" : 
                          "#94a3b8" 
                      }}
                    />
                    
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {getStatusIcon(assignment.status)}
                            {assignment.task}
                          </CardTitle>
                          <CardDescription>
                            {format(parseISO(assignment.date), "EEEE, MMMM d, yyyy")}
                            {' • '}
                            {assignment.start_time} - {assignment.end_time}
                          </CardDescription>
                        </div>
                        {getDateBadge(assignment.date)}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-muted-foreground">Crew</span>
                          <span className="font-medium flex items-center">
                            <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                            {assignment.crew_name}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <span className="font-medium">
                            <Badge 
                              variant={assignment.status === "completed" ? "default" : "outline"}
                              className={
                                assignment.status === "in_progress" ? "border-blue-500 text-blue-500" :
                                assignment.status === "cancelled" ? "border-red-500 text-red-500" : ""
                              }
                            >
                              {assignment.status.replace("_", " ")}
                            </Badge>
                          </span>
                        </div>
                      </div>
                      
                      {assignment.notes && (
                        <div className="mt-3">
                          <span className="text-sm text-muted-foreground">Notes</span>
                          <p className="text-sm mt-1">{assignment.notes}</p>
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="justify-end space-x-2">
                      {assignment.status === "scheduled" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => prepareUpdateStatus(assignment, "in_progress")}
                        >
                          Start Work
                        </Button>
                      )}
                      
                      {assignment.status === "in_progress" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => prepareUpdateStatus(assignment, "completed")}
                        >
                          Mark Complete
                        </Button>
                      )}
                      
                      {onViewDetails && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => onViewDetails(assignment)}
                        >
                          Details
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Completion Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Work Assignment</DialogTitle>
            <DialogDescription>
              Add completion notes for this work assignment. This will mark the assignment as completed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <h4 className="text-sm font-medium mb-1">Completion Notes</h4>
              <Textarea
                placeholder="Add notes about the completed work..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => handleStatusUpdate("completed")}>Mark as Completed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
