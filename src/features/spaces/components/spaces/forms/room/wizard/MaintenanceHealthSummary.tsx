import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "../RoomFormSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MaintenanceHealthSummaryProps {
  form: UseFormReturn<RoomFormData>;
  roomId?: string;
}

export function MaintenanceHealthSummary({ form, roomId }: MaintenanceHealthSummaryProps) {
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

      </CardContent>
    </Card>
  );
}
