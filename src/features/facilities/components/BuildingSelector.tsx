/**
 * BuildingSelector Component
 * 
 * Dropdown selector for choosing a building
 * 
 * @module features/facilities/components/BuildingSelector
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBuildings } from '../hooks/useFacilities';

interface BuildingSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function BuildingSelector({
  value,
  onValueChange,
  placeholder = 'Select building',
}: BuildingSelectorProps) {
  const { data: buildings, isLoading } = useBuildings();

  return (
    <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? 'Loading...' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {buildings?.map((building) => (
          <SelectItem key={building.id} value={building.id}>
            {building.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
