import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Lightbulb, Zap, MapPin, Calendar } from "lucide-react";

interface LightingFilters {
  status: string;
  type: string[];
  location: string[];
  maintenance: string;
}

interface MobileLightingFiltersProps {
  filters: LightingFilters;
  onFiltersChange: (filters: LightingFilters) => void;
}

export function MobileLightingFilters({
  filters,
  onFiltersChange
}: MobileLightingFiltersProps) {
  const statusOptions = [
    { value: "all", label: "All Fixtures" },
    { value: "operational", label: "Operational" },
    { value: "maintenance", label: "Needs Maintenance" },
    { value: "offline", label: "Offline" },
    { value: "issues", label: "Has Issues" }
  ];

  const typeOptions = [
    { value: "led", label: "LED Lights" },
    { value: "fluorescent", label: "Fluorescent" },
    { value: "incandescent", label: "Incandescent" },
    { value: "emergency", label: "Emergency Lighting" },
    { value: "outdoor", label: "Outdoor Lighting" }
  ];

  const locationOptions = [
    { value: "lobby", label: "Lobby" },
    { value: "office", label: "Office Areas" },
    { value: "hallway", label: "Hallways" },
    { value: "stairwell", label: "Stairwells" },
    { value: "parking", label: "Parking Areas" },
    { value: "exterior", label: "Exterior" }
  ];

  const maintenanceOptions = [
    { value: "all", label: "All Fixtures" },
    { value: "overdue", label: "Overdue Maintenance" },
    { value: "due_soon", label: "Due Soon (30 days)" },
    { value: "scheduled", label: "Scheduled" },
    { value: "no_schedule", label: "No Schedule" }
  ];

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value });
  };

  const handleTypeChange = (typeValue: string, checked: boolean) => {
    const newTypes = checked 
      ? [...filters.type, typeValue]
      : filters.type.filter(t => t !== typeValue);
    onFiltersChange({ ...filters, type: newTypes });
  };

  const handleLocationChange = (locationValue: string, checked: boolean) => {
    const newLocations = checked 
      ? [...filters.location, locationValue]
      : filters.location.filter(l => l !== locationValue);
    onFiltersChange({ ...filters, location: newLocations });
  };

  const handleMaintenanceChange = (value: string) => {
    onFiltersChange({ ...filters, maintenance: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: "all",
      type: [],
      location: [],
      maintenance: "all"
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status !== "all") count++;
    if (filters.type.length > 0) count++;
    if (filters.location.length > 0) count++;
    if (filters.maintenance !== "all") count++;
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Clear Filters Button */}
      {getActiveFilterCount() > 0 && (
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-primary"
          >
            Clear All ({getActiveFilterCount()})
          </Button>
        </div>
      )}

      {/* Status Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Status</Label>
        </div>
        <RadioGroup 
          value={filters.status} 
          onValueChange={handleStatusChange}
          className="space-y-2"
        >
          {statusOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`status-${option.value}`} />
              <Label 
                htmlFor={`status-${option.value}`}
                className="text-sm cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Type Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Fixture Type</Label>
        </div>
        <div className="space-y-2">
          {typeOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${option.value}`}
                checked={filters.type.includes(option.value)}
                onCheckedChange={(checked) => 
                  handleTypeChange(option.value, checked as boolean)
                }
              />
              <Label 
                htmlFor={`type-${option.value}`}
                className="text-sm cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Location Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Location</Label>
        </div>
        <div className="space-y-2">
          {locationOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`location-${option.value}`}
                checked={filters.location.includes(option.value)}
                onCheckedChange={(checked) => 
                  handleLocationChange(option.value, checked as boolean)
                }
              />
              <Label 
                htmlFor={`location-${option.value}`}
                className="text-sm cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Maintenance Status</Label>
        </div>
        <RadioGroup 
          value={filters.maintenance} 
          onValueChange={handleMaintenanceChange}
          className="space-y-2"
        >
          {maintenanceOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`maintenance-${option.value}`} />
              <Label 
                htmlFor={`maintenance-${option.value}`}
                className="text-sm cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}