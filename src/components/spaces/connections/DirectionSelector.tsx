import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Direction } from "../schemas/createSpaceSchema";

interface DirectionSelectorProps {
  value: Direction;
  onChange: (value: Direction) => void;
  disabled?: boolean;
}

export function DirectionSelector({ value, onChange, disabled }: DirectionSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Select direction" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="north">North</SelectItem>
        <SelectItem value="south">South</SelectItem>
        <SelectItem value="east">East</SelectItem>
        <SelectItem value="west">West</SelectItem>
        <SelectItem value="adjacent">Adjacent</SelectItem>
      </SelectContent>
    </Select>
  );
}