import { useState } from "react";
import { format } from "date-fns";
import { useRelocationDetails } from "../hooks/useRelocations";
import { useScheduleChanges } from "../hooks/useScheduleChanges";
// import { useNotifications } from "../hooks/useNotifications"; // Removed this import
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Calendar, CheckCircle, Clock, Edit, Mail, MapPin, XCircle } from "lucide-react";
import { NotificationRecipient } from "../services/notificationService";
import { RelocationStatus } from "../types/relocationTypes";

// Create a temporary mock for useNotifications until the actual hook is available
const useNotifications = () => {
  return {
    sendRelocationNotification: async ({ relocationId, recipients, subject, message }: {
      relocationId: string;
      recipients: NotificationRecipient[];
      subject?: string;
      message?: string;
    }) => {
      console.log('Sending notification:', { relocationId, recipients, subject, message });
      return Promise.resolve();
    },
    isSendingRelocationNotification: false
  };
};

interface RelocationDetailsProps {
  id: string;
}

export function RelocationDetails({ id }: RelocationDetailsProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false);
  
  const { 
    relocation, 
    isLoading, 
    isError, 
    error,
    updateRelocation,
    activateRelocation,
    completeRelocation,
    cancelRelocation,
    isUpdating,
    isActivating,
    isCompleting,
    isCancelling
  } = useRelocationDetails(id);
  
  const { 
    scheduleChanges, 
    isLoading: isLoadingScheduleChanges 
  } = useScheduleChanges(id);
  
  const { 
    sendRelocationNotification, 
    isSendingRelocationNotification 
  } = useNotifications();
  
  // Calculate days active and progress
  const calculateProgress = () => {
    if (!relocation) return 0;
    
    const startDate = new Date(relocation.start_date);
    const endDate = relocation.expected_end_date 
      ? new Date(relocation.expected_end_date) 
      : null;
    const today = new Date();
    
    if (!endDate) return 0;
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysActive = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.min(Math.round((daysActive / totalDays) * 100), 100);
  };
  
  // Handle status change
  const handleStatusChange = (newStatus: RelocationStatus) => {
    switch (newStatus) {
      case "active":
        activateRelocation();
        break;
      case "completed":
        completeRelocation();
        break;
      case "cancelled":
        cancelRelocation();
        break;
      default:
        break;
    }
  };
  
  // Handle notification submission
  const handleSendNotification = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const subject = formData.get("subject") as string;
    const message = formData.get("message") as string;
    const recipientEmails = formData.get("recipients") as string;
    
    // Parse recipient emails
    const recipients: NotificationRecipient[] = recipientEmails
      .split(",")
      .map(email => email.trim())
      .filter(email => email.length > 0)
      .map(email => ({ email }));
    
    if (relocation && recipients.length > 0) {
      sendRelocationNotification({
        relocationId: relocation.id,
        recipients,
        subject,
        message
      });
      setIsNotifyDialogOpen(false);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-500 flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            Error Loading Relocation
          </CardTitle>
          <CardDescription>
            There was a problem loading the relocation details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error?.message || "An unknown error occurred. Please try again later."}
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // No relocation found
  if (!relocation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relocation Not Found</CardTitle>
          <CardDescription>
            The requested relocation could not be found.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The relocation may have been deleted or you may not have permission to view it.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Status badge color
  const getStatusBadge = (status: RelocationStatus) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Pending</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Relocation Details
            <span className="ml-3">{getStatusBadge(relocation.status)}</span>
          </h1>
          <p className="text-muted-foreground">
            {relocation.original_room?.name || "Unknown Room"} → {relocation.temporary_room?.name || "Unknown Room"}
          </p>
        </div>
        
        <div className="flex gap-2">
          {relocation.status === "pending" && (
            <Button 
              onClick={() => handleStatusChange("active")}
              disabled={isActivating}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Activate
            </Button>
          )}
          
          {relocation.status === "active" && (
            <Button 
              onClick={() => handleStatusChange("completed")}
              disabled={isCompleting}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete
            </Button>
          )}
          
          {(relocation.status === "pending" || relocation.status === "active") && (
            <Button 
              variant="destructive"
              onClick={() => handleStatusChange("cancelled")}
              disabled={isCancelling}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
          
          <Dialog open={isNotifyDialogOpen} onOpenChange={setIsNotifyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Notify
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSendNotification}>
                <DialogHeader>
                  <DialogTitle>Send Notification</DialogTitle>
                  <DialogDescription>
                    Send a notification about this relocation to stakeholders.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="recipients">Recipients (comma-separated)</Label>
                    <Input
                      id="recipients"
                      name="recipients"
                      placeholder="email1@example.com, email2@example.com"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="Relocation Update"
                      defaultValue={`Relocation Update: ${relocation.original_room?.name || "Room"}`}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Enter your message here"
                      rows={5}
                      defaultValue={`This is to inform you about the temporary relocation of ${relocation.original_room?.name || "a room"} (Room ${relocation.original_room?.room_number || "N/A"}) to ${relocation.temporary_room?.name || "another room"} (Room ${relocation.temporary_room?.room_number || "N/A"}) from ${format(new Date(relocation.start_date), "MMMM d, yyyy")}${relocation.expected_end_date ? ` to ${format(new Date(relocation.expected_end_date), "MMMM d, yyyy")}` : ""}.`}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={isSendingRelocationNotification}
                  >
                    {isSendingRelocationNotification ? "Sending..." : "Send Notification"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="schedule">Schedule Changes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relocation Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Original Location</h3>
                    <p className="text-lg font-medium">
                      {relocation.original_room?.name || "Unknown Room"}
                    </p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="mr-1 h-4 w-4" />
                      <span>
                        Room {relocation.original_room?.room_number || "N/A"}, 
                        {relocation.original_room?.floor?.name || "Unknown Floor"}, 
                        {relocation.original_room?.floor?.building?.name || "Unknown Building"}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Temporary Location</h3>
                    <p className="text-lg font-medium">
                      {relocation.temporary_room?.name || "Unknown Room"}
                    </p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="mr-1 h-4 w-4" />
                      <span>
                        Room {relocation.temporary_room?.room_number || "N/A"}, 
                        {relocation.temporary_room?.floor?.name || "Unknown Floor"}, 
                        {relocation.temporary_room?.floor?.building?.name || "Unknown Building"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Timeline</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          <span className="font-medium">Start Date:</span> {format(new Date(relocation.start_date), "MMMM d, yyyy")}
                        </span>
                      </div>
                      
                      {relocation.expected_end_date && (
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>
                            <span className="font-medium">Expected End:</span> {format(new Date(relocation.expected_end_date), "MMMM d, yyyy")}
                          </span>
                        </div>
                      )}
                      
                      {relocation.actual_end_date && (
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>
                            <span className="font-medium">Actual End:</span> {format(new Date(relocation.actual_end_date), "MMMM d, yyyy")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {relocation.status === "active" && relocation.expected_end_date && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Progress</h3>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Completion</span>
                          <span>{calculateProgress()}%</span>
                        </div>
                        <Progress value={calculateProgress()} className="h-2" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Reason for Relocation</h3>
                  <p className="mt-1">{relocation.reason}</p>
                </div>
                
                {relocation.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Additional Notes</h3>
                    <p className="mt-1">{relocation.notes}</p>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Created: {format(new Date(relocation.created_at), "MMMM d, yyyy 'at' h:mm a")}</span>
                </div>
                <div className="flex items-center mt-1">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Last Updated: {format(new Date(relocation.updated_at), "MMMM d, yyyy 'at' h:mm a")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Changes</CardTitle>
              <CardDescription>
                Court schedule changes associated with this relocation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingScheduleChanges ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="py-4">
                        <Skeleton className="h-5 w-1/3 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <Skeleton className="h-4 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : scheduleChanges.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">
                  No schedule changes have been added for this relocation.
                </p>
              ) : (
                <div className="space-y-4">
                  {scheduleChanges.map((change) => (
                    <Card key={change.id}>
                      <CardContent className="py-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">
                              {change.original_court_part}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Temporarily assigned to: {change.temporary_assignment}
                            </p>
                          </div>
                          {getStatusBadge(change.status as RelocationStatus)}
                        </div>
                        
                        <div className="flex items-center text-sm text-muted-foreground space-x-4 mt-2">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4" />
                            <span>From: {format(new Date(change.start_date), "MMM d, yyyy")}</span>
                          </div>
                          {change.end_date && (
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-4 w-4" />
                              <span>To: {format(new Date(change.end_date), "MMM d, yyyy")}</span>
                            </div>
                          )}
                        </div>
                        
                        {change.special_instructions && (
                          <div className="mt-3 text-sm">
                            <span className="font-medium">Special Instructions: </span>
                            {change.special_instructions}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 