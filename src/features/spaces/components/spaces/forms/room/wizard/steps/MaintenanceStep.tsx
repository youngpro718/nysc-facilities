import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "../../RoomFormSchema";
import { MaintenanceHealthSummary } from "../MaintenanceHealthSummary";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, ExternalLink, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSpaceFixtures } from "@/features/lighting/hooks/useLightingData";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface MaintenanceStepProps {
  form: UseFormReturn<RoomFormData>;
  roomId?: string;
}

export function MaintenanceStep({ form, roomId }: MaintenanceStepProps) {
  const { isAdmin } = useAuth();
  const { data: fixtures = [], isLoading: fixturesLoading } = useSpaceFixtures(
    roomId || '',
    'room'
  );

  const fixtureStats = {
    total: fixtures.length,
    operational: fixtures.filter(f => f.status === 'functional').length,
    out: fixtures.filter(f => f.status === 'non_functional').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Maintenance & Health Summary</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Inspection history and scheduled maintenance
        </p>
      </div>

      <MaintenanceHealthSummary form={form} roomId={roomId} />

      {/* Lighting Status Section */}
      {roomId && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Lighting Status
                </h4>
              </div>

              {fixturesLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : fixtures.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="font-medium">{fixtureStats.total}</span>
                      <span className="text-muted-foreground ml-1">fixtures</span>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div>
                      <span className="font-medium text-green-600">{fixtureStats.operational}</span>
                      <span className="text-muted-foreground ml-1">operational</span>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div>
                      <span className="font-medium text-orange-600">{fixtureStats.out}</span>
                      <span className="text-muted-foreground ml-1">out</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open(`/operations?tab=lighting&room_id=${roomId}`, '_blank');
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View in Operations
                    </Button>
                    {isAdmin && (
                      <Button variant="outline" size="sm" disabled>
                        <Plus className="h-3 w-3 mr-1" />
                        Add Fixture
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No lighting fixtures configured for this room
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
