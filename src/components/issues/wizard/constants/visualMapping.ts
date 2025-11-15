import React from 'react';
import { 
  Bolt, 
  Droplet, 
  Building2, 
  Key, 
  Thermometer, 
  Trash2,
  MessageSquare,
  LucideProps 
} from "lucide-react";
import { StandardizedIssueType } from "../../constants/issueTypes";
import { IssueTypeOption } from "../types/index";

const createIcon = (Icon: React.ComponentType<LucideProps>) => (
  React.createElement(Icon, { className: "h-6 w-6" })
);

export const VISUAL_ISSUE_TYPE_MAPPING: Record<StandardizedIssueType, IssueTypeOption> = {
  'ACCESS_REQUEST': {
    id: 'ACCESS_REQUEST',
    label: 'Access Request',
    icon: createIcon(Key),
    color: 'text-purple-500',
    description: 'Card reader, key issues, door access'
  },
  'BUILDING_SYSTEMS': {
    id: 'BUILDING_SYSTEMS',
    label: 'Building Systems',
    icon: createIcon(Building2),
    color: 'text-green-500',
    description: 'HVAC, electrical, plumbing, security'
  },
  'CLEANING_REQUEST': {
    id: 'CLEANING_REQUEST',
    label: 'Cleaning',
    icon: createIcon(Trash2),
    color: 'text-teal-500',
    description: 'Regular service, spills, deep clean'
  },
  'CLIMATE_CONTROL': {
    id: 'CLIMATE_CONTROL',
    label: 'Climate Control',
    icon: createIcon(Thermometer),
    color: 'text-orange-500',
    description: 'Temperature, humidity, ventilation'
  },
  'ELECTRICAL_NEEDS': {
    id: 'ELECTRICAL_NEEDS',
    label: 'Electrical',
    icon: createIcon(Bolt),
    color: 'text-yellow-500',
    description: 'Outlets, power issues, wiring'
  },
  'GENERAL_REQUESTS': {
    id: 'GENERAL_REQUESTS',
    label: 'General Requests',
    icon: createIcon(MessageSquare),
    color: 'text-blue-500',
    description: 'Maintenance, installation, repair'
  },
  'PLUMBING_NEEDS': {
    id: 'PLUMBING_NEEDS',
    label: 'Plumbing',
    icon: createIcon(Droplet),
    color: 'text-blue-500',
    description: 'Leak, clog, no water, water pressure'
  }
};

export const getAllVisualIssueTypes = (): IssueTypeOption[] => {
  return Object.values(VISUAL_ISSUE_TYPE_MAPPING);
};