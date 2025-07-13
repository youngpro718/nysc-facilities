import React from 'react';
import { 
  Bolt, 
  Droplet, 
  Building2, 
  Key, 
  Thermometer, 
  Trash2,
  Square,
  DoorOpen,
  Lightbulb,
  Lock,
  RectangleHorizontal,
  AlertTriangle,
  Home,
  Droplets,
  Lightbulb as LightbulbIcon,
  Flag,
  Layers,
  MessageSquare,
  Bath,
  Signpost,
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
  'CEILING': {
    id: 'CEILING',
    label: 'Ceiling',
    icon: createIcon(Square),
    color: 'text-gray-500',
    description: 'Tiles, leaks, lighting, vents'
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
  'DOOR': {
    id: 'DOOR',
    label: 'Door Issues',
    icon: createIcon(DoorOpen),
    color: 'text-brown-500',
    description: "Won't lock, won't close, handle broken"
  },
  'ELECTRICAL_NEEDS': {
    id: 'ELECTRICAL_NEEDS',
    label: 'Electrical',
    icon: createIcon(Bolt),
    color: 'text-yellow-500',
    description: 'Outlets, power issues, wiring'
  },
  'EMERGENCY': {
    id: 'EMERGENCY',
    label: 'Emergency',
    icon: createIcon(AlertTriangle),
    color: 'text-red-500',
    description: 'Fire, flood, security, medical'
  },
  'EXTERIOR_FACADE': {
    id: 'EXTERIOR_FACADE',
    label: 'Exterior Facade',
    icon: createIcon(Home),
    color: 'text-stone-500',
    description: 'Windows, walls, signage, structural'
  },
  'FLAGPOLE_FLAG': {
    id: 'FLAGPOLE_FLAG',
    label: 'Flagpole/Flag',
    icon: createIcon(Flag),
    color: 'text-red-600',
    description: 'Repair, replacement, installation'
  },
  'FLOORING': {
    id: 'FLOORING',
    label: 'Flooring',
    icon: createIcon(Layers),
    color: 'text-amber-600',
    description: 'Carpet, tile, wood, safety hazard'
  },
  'GENERAL_REQUESTS': {
    id: 'GENERAL_REQUESTS',
    label: 'General Requests',
    icon: createIcon(MessageSquare),
    color: 'text-blue-500',
    description: 'Maintenance, installation, repair'
  },
  'LEAK': {
    id: 'LEAK',
    label: 'Leak',
    icon: createIcon(Droplets),
    color: 'text-blue-600',
    description: 'Water, gas, ceiling, pipe'
  },
  'LIGHTING': {
    id: 'LIGHTING',
    label: 'Lighting',
    icon: createIcon(LightbulbIcon),
    color: 'text-yellow-400',
    description: 'Bulb out, fixture, emergency light'
  },
  'LOCK': {
    id: 'LOCK',
    label: 'Lock Issues',
    icon: createIcon(Lock),
    color: 'text-indigo-500',
    description: 'Key, electronic, broken, replacement'
  },
  'PLUMBING_NEEDS': {
    id: 'PLUMBING_NEEDS',
    label: 'Plumbing',
    icon: createIcon(Droplet),
    color: 'text-blue-500',
    description: 'Leak, clog, no water, water pressure'
  },
  'RESTROOM_REPAIR': {
    id: 'RESTROOM_REPAIR',
    label: 'Restroom Repair',
    icon: createIcon(Bath),
    color: 'text-cyan-500',
    description: 'Fixture, plumbing, supplies, cleaning'
  },
  'SIGNAGE': {
    id: 'SIGNAGE',
    label: 'Signage',
    icon: createIcon(Signpost),
    color: 'text-slate-500',
    description: 'New, repair, update, remove'
  },
  'WINDOW': {
    id: 'WINDOW',
    label: 'Window',
    icon: createIcon(RectangleHorizontal),
    color: 'text-sky-500',
    description: 'Broken, seal, lock, screen'
  }
};

export const getAllVisualIssueTypes = (): IssueTypeOption[] => {
  return Object.values(VISUAL_ISSUE_TYPE_MAPPING);
};