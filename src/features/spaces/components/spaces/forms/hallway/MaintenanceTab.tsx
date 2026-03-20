
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EditSpaceFormData } from "../../schemas/editSpaceSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Lightbulb, Play, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useSpaceFixtures, useWalkthroughHistory } from "@/features/lighting/hooks/useLightingData";
import { WalkthroughFlow } from "@/features/operations/components/lighting/WalkthroughFlow";
import { Skeleton } from "@/components/ui/skeleton";

interface MaintenanceTabProps {
  form: UseFormReturn<EditSpaceFormData>;
  hallwayId?: string;
}

export function MaintenanceTab({ form, hallwayId }: MaintenanceTabProps) {
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const maintenanceSchedule = form.watch("maintenanceSchedule") || [];

  const handleAddSchedule = () => {
    const currentSchedule = form.getValues("maintenanceSchedule") || [];
    form.setValue("maintenanceSchedule", [
      ...currentSchedule,
      { date: "", type: "routine", status: "scheduled", assignedTo: "" }
    ]);
  };

  const handleRemoveSchedule = (index: number) => {
    const currentSchedule = form.getValues("maintenanceSchedule") || [];
    form.setValue(
      "maintenanceSchedule",
      currentSchedule.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Maintenance</h3>
        <p className="text-sm text-muted-foreground">
          Manage maintenance schedules and related information.
        </p>
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="maintenancePriority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maintenance Priority</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || "low"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maintenanceNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maintenance Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter maintenance notes"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          {maintenanceSchedule.map((_, index) => (
            <div key={index} className="flex gap-4 items-start p-4 border rounded-md">
              <div className="flex-1 space-y-4">
                <FormField
                  control={form.control}
                  name={`maintenanceSchedule.${index}.date`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`maintenanceSchedule.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="routine">Routine</SelectItem>
                          <SelectItem value="inspection">Inspection</SelectItem>
                          <SelectItem value="repair">Repair</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`maintenanceSchedule.${index}.status`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`maintenanceSchedule.${index}.assignedTo`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Person responsible" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => handleRemoveSchedule(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddSchedule}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Maintenance Schedule
          </Button>
        </div>
      </div>

      {/* Lighting Walkthrough Section */}
      {hallwayId && <LightingWalkthroughSection hallwayId={hallwayId} />}

      {/* Walkthrough Flow Dialog */}
      <WalkthroughFlow
        open={walkthroughOpen}
        onOpenChange={setWalkthroughOpen}
        hallwayId={hallwayId}
      />
    </div>
  );
}

// Lighting Walkthrough Section Component
function LightingWalkthroughSection({ hallwayId }: { hallwayId: string }) {
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const { data: fixtures = [], isLoading: fixturesLoading } = useSpaceFixtures(hallwayId, 'hallway');
  const { data: history = [], isLoading: historyLoading } = useWalkthroughHistory(hallwayId, 1);
  
  const lastWalkthrough = history[0];
  const fixtureStats = {
    total: fixtures.length,
    out: fixtures.filter(f => f.status === 'non_functional').length,
    needsElectrician: fixtures.filter(f => f.requires_electrician).length,
  };

  return (
    <>
      <Separator />
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Lighting Walkthrough
              </h4>
            </div>

            {fixturesLoading || historyLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="space-y-4">
                {/* Last Walkthrough Info */}
                {lastWalkthrough ? (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Last walkthrough: </span>
                      <span className="font-medium">
                        {format(new Date(lastWalkthrough.started_at), 'PPp')}
                      </span>
                    </div>
                    {lastWalkthrough.issues_found > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium text-orange-600">
                          {lastWalkthrough.issues_found} issue{lastWalkthrough.issues_found !== 1 ? 's' : ''} found
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No walkthrough history
                  </div>
                )}

                {/* Fixture Count */}
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="font-medium">{fixtureStats.total}</span>
                      <span className="text-muted-foreground ml-1">fixtures in this hallway</span>
                    </div>
                    {fixtureStats.out > 0 && (
                      <>
                        <div className="h-4 w-px bg-border" />
                        <div>
                          <span className="font-medium text-orange-600">{fixtureStats.out}</span>
                          <span className="text-muted-foreground ml-1">out</span>
                        </div>
                      </>
                    )}
                    {fixtureStats.needsElectrician > 0 && (
                      <>
                        <div className="h-4 w-px bg-border" />
                        <div>
                          <span className="font-medium text-red-600">{fixtureStats.needsElectrician}</span>
                          <span className="text-muted-foreground ml-1">need electrician</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Start Walkthrough Button */}
                <Button
                  onClick={() => setWalkthroughOpen(true)}
                  variant="outline"
                  size="sm"
                  disabled={fixtureStats.total === 0}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Start New Walkthrough
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Walkthrough Flow Dialog */}
      <WalkthroughFlow
        open={walkthroughOpen}
        onOpenChange={setWalkthroughOpen}
        hallwayId={hallwayId}
      />
    </>
  );
}
