import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "../../RoomFormSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EnrichmentStepProps {
  form: UseFormReturn<RoomFormData>;
}

export function EnrichmentStep({ form }: EnrichmentStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Optional Enrichment</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Additional details about technology, security, and environment
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="securityLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Security Level</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select security level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                    <SelectItem value="secure">Secure</SelectItem>
                    <SelectItem value="high_security">High Security</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="environmentalControls"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Environmental Controls</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., HVAC Zone 3, Lighting Circuit B2"
                    {...field}
                    value={field.value || ""}
                    className="min-h-[80px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
