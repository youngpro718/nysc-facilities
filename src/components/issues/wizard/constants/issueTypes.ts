import React from 'react';
import { 
  Bolt, 
  Droplet, 
  Building2, 
  Key, 
  Thermometer, 
  Trash2,
  LucideProps 
} from "lucide-react";
import { IssueTypeOption } from "../types/index";

export type StandardizedIssueType = 
  | 'ELECTRICAL_NEEDS'
  | 'PLUMBING_NEEDS'
  | 'CLIMATE_CONTROL'
  | 'ACCESS_REQUEST'
  | 'BUILDING_SYSTEMS'
  | 'CLEANING_REQUEST';

const createIcon = (Icon: React.ComponentType<LucideProps>) => (
  React.createElement(Icon, { className: "h-8 w-8" })
);

export const ISSUE_TYPES: readonly IssueTypeOption[] = [
  {
    id: 'ELECTRICAL_NEEDS',
    label: 'Electrical',
    icon: createIcon(Bolt),
    color: 'text-yellow-500',
    description: 'Power, lighting, or electrical issues'
  },
  {
    id: 'PLUMBING_NEEDS',
    label: 'Plumbing',
    icon: createIcon(Droplet),
    color: 'text-blue-500',
    description: 'Water, leaks, or plumbing problems'
  },
  {
    id: 'CLIMATE_CONTROL',
    label: 'Climate',
    icon: createIcon(Thermometer),
    color: 'text-orange-500',
    description: 'Heating, cooling, or ventilation'
  },
  {
    id: 'ACCESS_REQUEST',
    label: 'Access',
    icon: createIcon(Key),
    color: 'text-purple-500',
    description: 'Door, lock, or access issues'
  },
  {
    id: 'BUILDING_SYSTEMS',
    label: 'Systems',
    icon: createIcon(Building2),
    color: 'text-green-500',
    description: 'Building infrastructure issues'
  },
  {
    id: 'CLEANING_REQUEST',
    label: 'Cleaning',
    icon: createIcon(Trash2),
    color: 'text-teal-500',
    description: 'Cleaning or maintenance needs'
  }
] as const;
