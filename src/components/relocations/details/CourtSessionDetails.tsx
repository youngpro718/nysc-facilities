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
  DialogFooter
} from "@/components/ui/dialog";
import { 
  AlertCircle, 
  Clock, 
  Calendar,
  Gavel,
  Trash2
} from "lucide-react";
import { CourtSession } from "../types/relocationTypes";
import { useRelocations } from "../hooks/useRelocations";

interface CourtSessionDetailsProps {
  relocationId: string;
  courtSessions: CourtSession[];
}

export function CourtSessionDetails({ relocationId, courtSessions }: CourtSessionDetailsProps) {
  const [selectedSession, setSelectedSession] = useState<CourtSession | null>(null);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  
  const { deleteCourtSession, isDeletingCourtSession } = useRelocations();
  
  const handleDeleteSession = async () => {
    if (!selectedSession) return;
    
    await deleteCourtSession({
      relocationId,
      courtSessionId: selectedSession.id
    });
    
    setConfirmDeleteDialog(false);
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
  
  // Sort sessions by date
  const sortedSessions = [...courtSessions].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
  
  // Group sessions by upcoming/past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingSessions = sortedSessions.filter(session => {
    const sessionDate = new Date(session.date);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate >= today;
  });
  
  const pastSessions = sortedSessions.filter(session => {
    const sessionDate = new Date(session.date);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate < today;
  });
  
  // Get session type display
  const getSessionTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      "regular": "Regular Session",
      "special": "Special Session",
      "hearing": "Hearing",
      "trial": "Trial",
      "other": "Other"
    };
    
    return types[type] || type;
  };
  
  // Render session card
  const renderSessionCard = (session: CourtSession) => {
    const sessionDate = new Date(session.date);
    const isToday = sessionDate.toDateString() === today.toDateString();
    
    return (
      <Card 
        key={session.id} 
        className={`
          ${isToday ? "border-primary" : ""}
        `}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">{getSessionTypeDisplay(session.session_type)}</h4>
              
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                <span>{format(sessionDate, "EEEE, MMMM d, yyyy")}</span>
                {isToday && (
                  <Badge variant="outline" className="ml-2 text-xs">Today</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>{formatTimeRange(session.start_time, session.end_time)}</span>
              </div>
              
              {session.judge && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Gavel className="h-3 w-3" />
                  <span>Judge {session.judge}</span>
                </div>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => {
                setSelectedSession(session);
                setConfirmDeleteDialog(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          {session.notes && (
            <div className="mt-3 p-2 bg-muted/30 rounded-md text-sm">
              <p>{session.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  if (courtSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Court Sessions</CardTitle>
          <CardDescription>
            No court sessions have been scheduled for this relocation yet
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex justify-center">
          <div className="text-center">
            <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Schedule court sessions to block off times when workers cannot be in the courtroom
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
              <CardTitle>Court Sessions</CardTitle>
              <CardDescription>
                {courtSessions.length} court {courtSessions.length === 1 ? 'session' : 'sessions'} for this relocation
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {upcomingSessions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  Upcoming Sessions ({upcomingSessions.length})
                </h3>
                <div className="space-y-3">
                  {upcomingSessions.map(renderSessionCard)}
                </div>
              </div>
            )}
            
            {pastSessions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  Past Sessions ({pastSessions.length})
                </h3>
                <div className="space-y-3">
                  {pastSessions.map(renderSessionCard)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={confirmDeleteDialog} onOpenChange={setConfirmDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Court Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this court session? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSession && (
            <div className="py-4">
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <p className="font-medium">{getSessionTypeDisplay(selectedSession.session_type)}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedSession.date), "MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatTimeRange(selectedSession.start_time, selectedSession.end_time)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteSession}
              disabled={isDeletingCourtSession}
            >
              {isDeletingCourtSession ? "Deleting..." : "Delete Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
