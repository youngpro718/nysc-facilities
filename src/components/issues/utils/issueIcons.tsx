
import { AlertTriangle, Building2, ChevronRight, Construction, DoorClosed, Flag, Key, Lightbulb, Power, Thermometer, Trash2, Waves } from "lucide-react";
import { StandardizedIssueType } from "../constants/issueTypes";

export const getIssueTypeIcon = (type: StandardizedIssueType) => {
  switch (type) {
    case 'ELECTRICAL_NEEDS':
      return <Power className="h-4 w-4" />;
    case 'PLUMBING_NEEDS':
      return <Waves className="h-4 w-4" />;
    case 'CLIMATE_CONTROL':
      return <Thermometer className="h-4 w-4" />;
    case 'ACCESS_REQUEST':
      return <Key className="h-4 w-4" />;
    case 'BUILDING_SYSTEMS':
      return <Building2 className="h-4 w-4" />;
    case 'CLEANING_REQUEST':
      return <Trash2 className="h-4 w-4" />;
    case 'DOOR':
      return <DoorClosed className="h-4 w-4" />;
    case 'LIGHTING':
      return <Lightbulb className="h-4 w-4" />;
    case 'EMERGENCY':
      return <AlertTriangle className="h-4 w-4" />;
    case 'GENERAL_REQUESTS':
      return <Construction className="h-4 w-4" />;
    default:
      return <Flag className="h-4 w-4" />;
  }
};
