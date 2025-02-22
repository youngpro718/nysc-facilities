
import { TypeFilters } from "./filters/TypeFilters";
import { SortAndGroupFilters } from "./filters/SortAndGroupFilters";
import { LightingFilters } from "./filters/LightingFilters";
import { IssueFilters as IssueFiltersType, SortOption, GroupingOption, ViewMode } from "./types/FilterTypes";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

interface IssueFiltersProps {
  onFilterChange: (filters: Partial<IssueFiltersType>) => void;
  onSortChange: (sort: SortOption) => void;
  onGroupingChange: (grouping: GroupingOption) => void;
  viewMode: ViewMode;
}

export const IssueFilters = ({ 
  onFilterChange, 
  onSortChange, 
  onGroupingChange,
  viewMode 
}: IssueFiltersProps) => {
  const [showLightingFilters, setShowLightingFilters] = useState(false);
  const [searchParams] = useSearchParams();

  // Initialize filters from URL params on mount and when URL params change
  useEffect(() => {
    const filters: Partial<IssueFiltersType> = {};
    searchParams.forEach((value, key) => {
      if (isValidFilterKey(key)) {
        switch (key) {
          case 'type':
            if (isValidType(value)) {
              filters.type = value;
              setShowLightingFilters(value === 'LIGHTING');
            }
            break;
          case 'status':
            if (isValidStatus(value)) filters.status = value;
            break;
          case 'priority':
            if (isValidPriority(value)) filters.priority = value;
            break;
          case 'assigned_to':
            if (isValidAssignment(value)) filters.assigned_to = value;
            break;
          case 'lightingType':
            if (isValidLightingType(value)) filters.lightingType = value;
            break;
          case 'fixtureStatus':
            if (isValidFixtureStatus(value)) filters.fixtureStatus = value;
            break;
          case 'electricalIssue':
            if (isValidElectricalIssue(value)) filters.electricalIssue = value;
            break;
          default:
            break;
        }
      }
    });
    
    if (Object.keys(filters).length > 0) {
      onFilterChange(filters);
    }
  }, [searchParams, onFilterChange]);

  const isValidFilterKey = (key: string): key is keyof IssueFiltersType => {
    return [
      'type', 'status', 'priority', 'assigned_to', 
      'lightingType', 'fixtureStatus', 'electricalIssue'
    ].includes(key);
  };

  const isValidType = (value: string): value is IssueFiltersType['type'] => {
    return value === 'all_types' || [
      'ACCESS_REQUEST', 'BUILDING_SYSTEMS', 'CEILING', 'CLEANING_REQUEST',
      'CLIMATE_CONTROL', 'DOOR', 'ELECTRICAL_NEEDS', 'EMERGENCY',
      'EXTERIOR_FACADE', 'FLAGPOLE_FLAG', 'FLOORING', 'GENERAL_REQUESTS',
      'LEAK', 'LIGHTING', 'LOCK', 'PLUMBING_NEEDS', 'RESTROOM_REPAIR',
      'SIGNAGE', 'WINDOW'
    ].includes(value);
  };

  const isValidStatus = (value: string): value is IssueFiltersType['status'] => {
    return ['open', 'in_progress', 'resolved', 'all_statuses'].includes(value);
  };

  const isValidPriority = (value: string): value is IssueFiltersType['priority'] => {
    return ['high', 'medium', 'low', 'all_priorities'].includes(value);
  };

  const isValidAssignment = (value: string): value is IssueFiltersType['assigned_to'] => {
    return ['DCAS', 'OCA', 'Self', 'Outside_Vendor', 'all_assignments'].includes(value);
  };

  const isValidLightingType = (value: string): value is IssueFiltersType['lightingType'] => {
    return ['standard', 'emergency', 'motion_sensor', 'all_lighting_types'].includes(value);
  };

  const isValidFixtureStatus = (value: string): value is IssueFiltersType['fixtureStatus'] => {
    return ['functional', 'maintenance_needed', 'non_functional', 'pending_maintenance', 'scheduled_replacement', 'all_fixture_statuses'].includes(value);
  };

  const isValidElectricalIssue = (value: string): value is IssueFiltersType['electricalIssue'] => {
    return ['short_circuit', 'wiring_issues', 'voltage_problems', 'ballast_issue', 'all_electrical_issues'].includes(value);
  };

  const handleTypeChange = (type: string) => {
    setShowLightingFilters(type === 'LIGHTING');
    if (isValidType(type)) {
      updateFilters({ type });
    }
  };

  const updateFilters = (newFilters: Partial<IssueFiltersType>) => {
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="w-full lg:w-auto">
          <TypeFilters 
            onFilterChange={(filters) => {
              if (filters.type) {
                handleTypeChange(filters.type);
              } else {
                updateFilters(filters);
              }
            }} 
          />
        </div>
        {viewMode !== 'timeline' && (
          <div className="w-full lg:w-auto">
            <SortAndGroupFilters 
              onSortChange={onSortChange}
              onGroupingChange={onGroupingChange}
            />
          </div>
        )}
      </div>
      <LightingFilters 
        onFilterChange={updateFilters}
        showLightingFilters={showLightingFilters}
      />
    </div>
  );
};

