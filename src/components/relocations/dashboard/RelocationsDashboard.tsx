import { useState } from "react";
import { useRelocations } from "../hooks/useRelocations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { RelocationStatus } from "../types/relocationTypes";
import { CompleteRelocationDialog } from "../dialogs/CompleteRelocationDialog";
import { CancelRelocationDialog } from "../dialogs/CancelRelocationDialog";
import { ActivateRelocationDialog } from "../dialogs/ActivateRelocationDialog";
import { CourtTermsTab } from "./CourtTermsTab";

export function RelocationsDashboard() {
  const {
    relocations,
    isLoading,
    activateRelocation,
    completeRelocation,
    cancelRelocation,
  } = useRelocations({ status: 'active' });

  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [selectedRelocationId, setSelectedRelocationId] = useState<string | null>(null);

  const handleActivate = async (id: string) => {
    try {
      await activateRelocation(id);
      setSelectedRelocationId(null);
      setIsActivateDialogOpen(false);
    } catch (error) {
      console.error('Error activating relocation:', error);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeRelocation(id);
      setSelectedRelocationId(null);
      setIsCompleteDialogOpen(false);
    } catch (error) {
      console.error('Error completing relocation:', error);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelRelocation(id);
      setSelectedRelocationId(null);
      setIsCancelDialogOpen(false);
    } catch (error) {
      console.error('Error cancelling relocation:', error);
    }
  };

  const activeRelocations = relocations.filter(r => r.status === 'active');
  const scheduledRelocations = relocations.filter(r => r.status === 'scheduled');
  const completedRelocations = relocations.filter(r => r.status === 'completed');

  if (isLoading) {
    return <div className="p-4">Loading relocations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active Relocations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRelocations.length}</div>
            <p className="text-sm text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scheduled Relocations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledRelocations.length}</div>
            <p className="text-sm text-muted-foreground">Awaiting activation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed Relocations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRelocations.length}</div>
            <p className="text-sm text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Upcoming Court Terms</h3>
        <CourtTermsTab />
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Scheduled Relocations</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scheduledRelocations.map((relocation) => (
            <Card key={relocation.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  Relocation ID: {relocation.id.substring(0, 8)}...
                  <Badge variant="secondary">{relocation.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(relocation.start_date), 'MMM dd, yyyy')} - {format(new Date(relocation.end_date), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{relocation.building_name}, {relocation.floor_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Created {formatDistanceToNow(new Date(relocation.created_at), { addSuffix: true })}</span>
                </div>
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRelocationId(relocation.id);
                      setIsActivateDialogOpen(true);
                    }}
                  >
                    Activate
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSelectedRelocationId(relocation.id);
                      setIsCancelDialogOpen(true);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {scheduledRelocations.length === 0 && (
          <div className="text-center py-4 text-gray-500">No scheduled relocations found.</div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Active Relocations</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeRelocations.map((relocation) => (
            <Card key={relocation.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  Relocation ID: {relocation.id.substring(0, 8)}...
                  <Badge variant="default">{relocation.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(relocation.start_date), 'MMM dd, yyyy')} - {format(new Date(relocation.end_date), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{relocation.building_name}, {relocation.floor_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Started {formatDistanceToNow(new Date(relocation.start_date), { addSuffix: true })}</span>
                </div>
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRelocationId(relocation.id);
                      setIsCompleteDialogOpen(true);
                    }}
                  >
                    Complete
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSelectedRelocationId(relocation.id);
                      setIsCancelDialogOpen(true);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {activeRelocations.length === 0 && (
          <div className="text-center py-4 text-gray-500">No active relocations found.</div>
        )}
      </div>

      <CompleteRelocationDialog
        isOpen={isCompleteDialogOpen}
        onClose={() => {
          setIsCompleteDialogOpen(false);
          setSelectedRelocationId(null);
        }}
        onComplete={handleComplete}
        relocationId={selectedRelocationId}
      />

      <CancelRelocationDialog
        isOpen={isCancelDialogOpen}
        onClose={() => {
          setIsCancelDialogOpen(false);
          setSelectedRelocationId(null);
        }}
        onCancel={handleCancel}
        relocationId={selectedRelocationId}
      />

      <ActivateRelocationDialog
        isOpen={isActivateDialogOpen}
        onClose={() => {
          setIsActivateDialogOpen(false);
          setSelectedRelocationId(null);
        }}
        onActivate={handleActivate}
        relocationId={selectedRelocationId}
      />
    </div>
  );
}
