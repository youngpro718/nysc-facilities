
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Direction } from "./types/ConnectionTypes";

interface DirectionSelectorProps {
  value: Direction;
  onChange: (value: Direction) => void;
  disabled?: boolean;
  connectionType?: string;
}

export function DirectionSelector({ value, onChange, disabled, connectionType }: DirectionSelectorProps) {
  const isHallwayConnection = connectionType === 'hallway';

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Select direction" />
      </SelectTrigger>
      <SelectContent>
        {isHallwayConnection ? (
          <>
            <SelectItem value="left_of_hallway">Left Side of Hallway</SelectItem>
            <SelectItem value="right_of_hallway">Right Side of Hallway</SelectItem>
          </>
        ) : (
          <>
            <SelectItem value="north">North</SelectItem>
            <SelectItem value="south">South</SelectItem>
            <SelectItem value="east">East</SelectItem>
            <SelectItem value="west">West</SelectItem>
            <SelectItem value="adjacent">Adjacent</SelectItem>
          </>
        )}
      </SelectContent>
    </Select>
  );
}
