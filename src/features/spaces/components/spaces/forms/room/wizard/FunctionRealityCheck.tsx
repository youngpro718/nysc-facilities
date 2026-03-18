import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "../RoomFormSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FunctionRealityCheckProps {
  form: UseFormReturn<RoomFormData>;
}

export function FunctionRealityCheck({ form }: FunctionRealityCheckProps) {
  const roomType = form.watch("roomType");
  const currentFunction = form.watch("currentFunction");

  // Check if there's a mismatch between designated type and current function
  const hasMismatch = currentFunction && currentFunction !== roomType;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Function Reality Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm font-medium mb-2">Designated Type</div>
            <Badge variant="outline" className="text-sm">
              {roomType ? roomType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "Not set"}
            </Badge>
          </div>

          <FormField
            control={form.control}
            name="currentFunction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Function</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Temporary Office"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  If different from designated type, describe current use
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {hasMismatch && (
          <>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Mismatch detected: This room is designated as <strong>{roomType}</strong> but is currently functioning as <strong>{currentFunction}</strong>.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="temporaryUseTimeline.startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temporary Use Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temporaryUseTimeline.endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="temporaryUseTimeline.reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Temporary Use</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Courtroom under renovation, temporary office space needed"
                      {...field}
                      value={field.value || ""}
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
