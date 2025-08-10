
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface BasicFixtureFieldsProps {
  form: any;
}

export function BasicFixtureFields({ form }: BasicFixtureFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="motion_sensor">Motion Sensor</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="technology"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Technology</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select technology" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="LED">LED</SelectItem>
                <SelectItem value="Fluorescent">Fluorescent</SelectItem>
                <SelectItem value="Bulb">Bulb</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="bulb_count"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Number of Bulbs</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min={1} 
                {...field} 
                onChange={(e) => {
                  const raw = e.target.value;
                  const n = parseInt(raw, 10);
                  field.onChange(Number.isNaN(n) ? undefined : Math.max(1, n));
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="functional">Functional</SelectItem>
                <SelectItem value="maintenance_needed">Maintenance Needed</SelectItem>
                <SelectItem value="non_functional">Non Functional</SelectItem>
                <SelectItem value="pending_maintenance">Pending Maintenance</SelectItem>
                <SelectItem value="scheduled_replacement">Scheduled Replacement</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="maintenance_notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maintenance Notes</FormLabel>
            <FormControl>
              <Textarea {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="installation_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Installation Date</FormLabel>
            <FormControl>
              <Input type="date" {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
