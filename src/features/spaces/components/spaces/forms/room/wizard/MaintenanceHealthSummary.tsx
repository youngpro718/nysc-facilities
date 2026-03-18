import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "../RoomFormSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Calendar, Lightbulb, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MaintenanceHealthSummaryProps {
  form: UseFormReturn<RoomFormData>;
  roomId?: string;
}

export function MaintenanceHealthSummary({ form, roomId }: MaintenanceHealthSummaryProps) {
  const { data: maintenanceData, isLoading } = useQuery({
    queryKey: ["room-maintenance-summary", roomId],
    queryFn: async () => {
      if (!roomId) return null;

      // Get lighting fixtures count and status
      const { data: lightingData } = await supabase
        .from("lighting_fixtures")
        .select("id, status")
        .eq("space_id", roomId)
        .eq("space_type", "room");

      const totalFixtures = lightingData?.length || 0;
      const functionalFixtures = lightingData?.filter((f) => f.status === "functional").length || 0;

      return {
        totalFixtures,
        functionalFixtures,
        lightingPercentage: totalFixtures > 0 ? Math.round((functionalFixtures / totalFixtures) * 100) : 100,
      };
    },
    enabled: !!roomId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance & Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Maintenance Schedule */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Maintenance Schedule
          </h4>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="lastInspectionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Inspection Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>When was this room last inspected?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextMaintenanceDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Maintenance Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>Schedule next maintenance</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Lighting Health */}
        {roomId && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Lighting Health
            </h4>

            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : maintenanceData ? (
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Fixtures</span>
                  <Badge variant="outline">{maintenanceData.totalFixtures}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Functional</span>
                  <Badge
                    variant={maintenanceData.lightingPercentage === 100 ? "default" : maintenanceData.lightingPercentage >= 80 ? "secondary" : "destructive"}
                  >
                    {maintenanceData.functionalFixtures} ({maintenanceData.lightingPercentage}%)
                  </Badge>
                </div>

                {maintenanceData.lightingPercentage < 100 && (
                  <div className="flex items-center gap-2 text-sm text-warning mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Some lighting fixtures need attention</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No lighting data available</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
