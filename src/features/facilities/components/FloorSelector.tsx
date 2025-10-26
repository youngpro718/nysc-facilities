/**
 * FloorSelector Component
 * 
 * Dropdown selector for choosing a floor within a building
 * 
 * @module features/facilities/components/FloorSelector
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFloors } from '../hooks/useFacilities';

interface FloorSelectorProps {
  buildingId?: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function FloorSelector({
  buildingId,
  value,
  onValueChange,
  placeholder = 'Select floor',
}: FloorSelectorProps) {
  const { data: floors, isLoading } = useFloors(buildingId);

  const disabled = !buildingId || isLoading;

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue
          placeholder={
            !buildingId
              ? 'Select a building first'
              : isLoading
              ? 'Loading...'
              : placeholder
          }
        />
      </SelectTrigger>
      <SelectContent>
        {floors?.map((floor) => (
          <SelectItem key={floor.id} value={floor.id}>
            {floor.name || `Floor ${floor.floor_number}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
