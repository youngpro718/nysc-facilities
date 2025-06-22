import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RoomRelocation } from "../types/relocationTypes";
import { fetchRelocationById } from "../services/queries/relocationQueries";
import { updateRelocation } from "../services/mutations/relocationMutations";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft, Calendar, CalendarClock, CircleAlert, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";



export function RelocationDetails({ id }: { id: string }) {
  const navigate = useNavigate();
  const [relocation, setRelocation] = useState<RoomRelocation | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const loadRelocation = async () => {
      try {
        setIsLoading(true);
        const data = await fetchRelocationById(id);
        setRelocation(data);
        

      } catch (error) {
        console.error("Error loading relocation:", error);
        toast.error("Failed to load relocation details");
      } finally {
        setIsLoading(false);
      }
    };

    loadRelocation();
  }, [id]);

  const handleStatusChange = async (newStatus: 'scheduled' | 'active' | 'completed' | 'cancelled') => {
    try {
      setIsUpdating(true);
      
      const updateData = { 
        id, 
        status: newStatus,
        actual_end_date: newStatus === 'completed' ? new Date().toISOString() : undefined
      };
      
      const updatedRelocation = await updateRelocation(updateData);
      setRelocation(updatedRelocation);
      
      toast.success(`Relocation ${newStatus === 'cancelled' ? 'cancelled' : 'marked as ' + newStatus}`);
    } catch (error) {
      console.error("Error updating relocation status:", error);
      toast.error("Failed to update relocation status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate("/relocations")} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Relocations
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
              <CardDescription>Please wait while we load the relocation details.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!relocation) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate("/relocations")} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Relocations
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Relocation Not Found</CardTitle>
              <CardDescription>The requested relocation could not be found.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Please check the relocation ID and try again.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate("/relocations")}>Go to Relocations</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "scheduled":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate("/relocations")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Relocations
          </Button>
          
          <div className="flex-1 text-xl font-bold">Relocation Details</div>
          
          <div className="flex gap-2">
            {relocation.status === 'scheduled' && (
              <Button 
                onClick={() => handleStatusChange('active')}
                disabled={isUpdating}
              >
                Activate
              </Button>
            )}
            
            {relocation.status === 'active' && (
              <Button 
                onClick={() => handleStatusChange('completed')}
                disabled={isUpdating}
              >
                Complete
              </Button>
            )}
            
            {(relocation.status === 'scheduled' || relocation.status === 'active') && (
              <Button 
                variant="destructive"
                onClick={() => handleStatusChange('cancelled')}
                disabled={isUpdating}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-1">
                      {relocation.original_room?.name || "Unknown Room"}
                    </CardTitle>
                    <CardDescription>
                      Relocated to: {relocation.temporary_room?.name || "Unknown Room"}
                    </CardDescription>
                  </div>
                  {getStatusBadge(relocation.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Original Room</h3>
                    <div className="font-medium">
                      {relocation.original_room?.name || "Unknown Room"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {relocation.original_room?.room_number || "No room number"}
                    </div>
                    {relocation.original_room?.room_type && (
                      <div className="text-sm text-muted-foreground capitalize">
                        Type: {relocation.original_room.room_type.replace(/_/g, ' ')}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Temporary Room</h3>
                    <div className="font-medium">
                      {relocation.temporary_room?.name || "Unknown Room"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {relocation.temporary_room?.room_number || "No room number"}
                    </div>
                    {relocation.temporary_room?.room_type && (
                      <div className="text-sm text-muted-foreground capitalize">
                        Type: {relocation.temporary_room.room_type.replace(/_/g, ' ')}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-2">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Timeline</h3>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <strong>Start Date:</strong>{" "}
                        {format(new Date(relocation.start_date), "MMMM d, yyyy")}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <strong>End Date:</strong>{" "}
                        {format(new Date(relocation.end_date), "MMMM d, yyyy")}
                      </div>
                    </div>
                    
                    {relocation.actual_end_date && (
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <strong>Actual End Date:</strong>{" "}
                          {format(new Date(relocation.actual_end_date), "MMMM d, yyyy")}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Details</h3>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <strong>Created:</strong>{" "}
                      {format(new Date(relocation.created_at), "MMMM d, yyyy")}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <strong>Type:</strong>{" "}
                      <span className="capitalize">{relocation.relocation_type.replace(/_/g, ' ')}</span>
                    </div>
                    
                    <div>
                      <strong>Reason:</strong> {relocation.reason}
                    </div>
                    
                    {relocation.notes && (
                      <div>
                        <strong>Notes:</strong> {relocation.notes}
                      </div>
                    )}
                  </div>
                </div>
                

              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Schedule Changes</CardTitle>
                <CardDescription>
                  Schedule changes related to this relocation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  <CircleAlert className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No schedule changes have been created yet.</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled>
                  Add Schedule Change
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Relocation notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  <p>No notifications created yet</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled>
                  Send Notification
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
