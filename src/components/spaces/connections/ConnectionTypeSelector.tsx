import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { ConnectionType } from "./types/ConnectionTypes";

interface ConnectionTypeSelectorProps {
  value: ConnectionType;
  onChange: (value: ConnectionType) => void;
  form: UseFormReturn<any>;
  disabled?: boolean;
  spaceType?: "room" | "hallway" | "door";
}

export function ConnectionTypeSelector({ value, onChange, form, disabled, spaceType }: ConnectionTypeSelectorProps) {
  return (
    <FormField
      control={form.control}
      name="connectionType"
      render={() => (
        <FormItem>
          <FormLabel>Connection Type</FormLabel>
          <Select 
            value={value} 
            onValueChange={(v) => {
              onChange(v as ConnectionType);
              form.setValue("connectionType", v);
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select connection type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="room">Adjacent Room</SelectItem>
              <SelectItem value="hallway">Hallway</SelectItem>
              <SelectItem value="door">Door</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
}