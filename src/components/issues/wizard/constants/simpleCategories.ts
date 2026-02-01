import React from 'react';
import { Bolt, Droplet, Thermometer, Trash2, MessageSquare, LucideProps } from "lucide-react";
import { StandardizedIssueType } from "../../constants/issueTypes";

export interface SimpleCategory {
  id: string;
  label: string;
  icon: React.ComponentType<LucideProps>;
  color: string;
  description: string;
  mapsTo: StandardizedIssueType;
}

// Simplified 5-category mapping for regular users
export const SIMPLE_CATEGORIES: SimpleCategory[] = [
  {
    id: 'electrical',
    label: 'Electrical',
    icon: Bolt,
    color: 'text-yellow-500',
    description: 'Lights, outlets, power',
    mapsTo: 'ELECTRICAL_NEEDS'
  },
  {
    id: 'plumbing',
    label: 'Plumbing',
    icon: Droplet,
    color: 'text-blue-500',
    description: 'Leaks, clogs, water',
    mapsTo: 'PLUMBING_NEEDS'
  },
  {
    id: 'climate',
    label: 'Climate',
    icon: Thermometer,
    color: 'text-orange-500',
    description: 'Temperature, AC, heat',
    mapsTo: 'CLIMATE_CONTROL'
  },
  {
    id: 'cleaning',
    label: 'Cleaning',
    icon: Trash2,
    color: 'text-teal-500',
    description: 'Spills, trash, cleaning',
    mapsTo: 'CLEANING_REQUEST'
  },
  {
    id: 'other',
    label: 'Other',
    icon: MessageSquare,
    color: 'text-purple-500',
    description: 'Everything else',
    mapsTo: 'GENERAL_REQUESTS'
  }
];

export function getCategoryById(id: string): SimpleCategory | undefined {
  return SIMPLE_CATEGORIES.find(cat => cat.id === id);
}

export function getBackendIssueType(simpleCategoryId: string): StandardizedIssueType {
  const category = getCategoryById(simpleCategoryId);
  return category?.mapsTo || 'GENERAL_REQUESTS';
}
