
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRelocations, useActiveRelocations } from "../hooks/useRelocations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activateRelocation, completeRelocation, cancelRelocation } from "../services/mutations/statusMutations";
import { CompleteRelocationDialog } from "../dialogs/CompleteRelocationDialog";
import { CancelRelocationDialog } from "../dialogs/CancelRelocationDialog";
import { ActivateRelocationDialog } from "../dialogs/ActivateRelocationDialog";
import { RelocationsCalendar } from "./RelocationsCalendar";
import { CourtTermsTab } from "./CourtTermsTab";
import { toast } from "sonner";
import { RoomRelocation } from "../types/relocationTypes";

export function RelocationsDashboard() {
  const { data: relocations = [], isLoading } = useRelocations();
  const { data: activeRelocations = [] } = useActiveRelocations();
  const [selectedRelocation, setSelectedRelocation] = useState<RoomRelocation | null>(null);
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const activateMutation = useMutation({
    mutationFn: activateRelocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      queryClient.invalidateQueries({ queryKey: ['active-relocations'] });
      toast.success("Relocation activated successfully");
      setActiveDialog(null);
    },
    onError: (error) => {
      toast.error(`Failed to activate relocation: ${error.message}`);
    }
  });

  const completeMutation = useMutation({
    mutationFn: completeRelocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      queryClient.invalidateQueries({ queryKey: ['active-relocations'] });
      toast.success("Relocation completed successfully");
      setActiveDialog(null);
    },
    onError: (error) => {
      toast.error(`Failed to complete relocation: ${error.message}`);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: cancelRelocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      queryClient.invalidateQueries({ queryKey: ['active-relocations'] });
      toast.success("Relocation cancelled successfully");
      setActiveDialog(null);
    },
    onError: (error) => {
      toast.error(`Failed to cancel relocation: ${error.message}`);
    }
  });

  const handleStatusChange = (relocation: RoomRelocation, action: string) => {
    setSelectedRelocation(relocation);
    setActiveDialog(action);
  };

  if (isLoading) {
    return <div>Loading relocations...</div>;
  }

  const scheduledRelocations = relocations.filter(r => r.status === 'scheduled');
  const inProgressRelocations = relocations.filter(r => r.status === 'active');
  const completedRelocations = relocations.filter(r => r.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledRelocations.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressRelocations.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRelocations.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="court-terms">Court Terms</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {relocations.map((relocation) => (
              <Card key={relocation.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{relocation.original_room_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Moving to: {relocation.temporary_room_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(relocation.start_date).toLocaleDateString()} - 
                        {new Date(relocation.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        relocation.status === 'active' ? 'default' :
                        relocation.status === 'completed' ? 'secondary' :
                        'outline'
                      }>
                        {relocation.status}
                      </Badge>
                      {relocation.status === 'scheduled' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusChange(relocation, 'activate')}
                        >
                          Activate
                        </Button>
                      )}
                      {relocation.status === 'active' && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusChange(relocation, 'complete')}
                          >
                            Complete
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleStatusChange(relocation, 'cancel')}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <RelocationsCalendar relocations={activeRelocations} />
        </TabsContent>

        <TabsContent value="court-terms">
          <CourtTermsTab />
        </TabsContent>
      </Tabs>

      {selectedRelocation && (
        <>
          <ActivateRelocationDialog
            open={activeDialog === 'activate'}
            onOpenChange={(open) => !open && setActiveDialog(null)}
            relocation={selectedRelocation}
            onConfirm={() => activateMutation.mutate(selectedRelocation.id)}
            isLoading={activateMutation.isPending}
          />
          <CompleteRelocationDialog
            open={activeDialog === 'complete'}
            onOpenChange={(open) => !open && setActiveDialog(null)}
            relocation={selectedRelocation}
            onConfirm={() => completeMutation.mutate(selectedRelocation.id)}
            isLoading={completeMutation.isPending}
          />
          <CancelRelocationDialog
            open={activeDialog === 'cancel'}
            onOpenChange={(open) => !open && setActiveDialog(null)}
            relocation={selectedRelocation}
            onConfirm={() => cancelMutation.mutate(selectedRelocation.id)}
            isLoading={cancelMutation.isPending}
          />
        </>
      )}
    </div>
  );
}
