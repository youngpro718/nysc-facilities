import { 
  Wrench, 
  Zap, 
  AlertTriangle, 
  Droplets,
  Wind,
  Key,
  ClipboardList
} from "lucide-react";

/**
 * Returns the appropriate icon for a given issue type
 */
export const getIssueTypeIcon = (type: string) => {
  switch (type.toUpperCase()) {
    case "ACCESS_REQUEST":
    case "ACCESS":
      return <Key className="h-4 w-4" />;
      
    case "BUILDING_SYSTEMS":
    case "MAINTENANCE":
      return <Wrench className="h-4 w-4" />;
      
    case "ELECTRICAL_NEEDS":
    case "ELECTRICAL":
      return <Zap className="h-4 w-4" />;
      
    case "PLUMBING_NEEDS":
    case "PLUMBING":
      return <Droplets className="h-4 w-4" />;
      
    case "CLIMATE_CONTROL":
    case "HVAC":
      return <Wind className="h-4 w-4" />;
      
    case "CLEANING_REQUEST":
    case "CLEANING":
      return <ClipboardList className="h-4 w-4" />;
      
    case "SECURITY":
      return <AlertTriangle className="h-4 w-4" />;
      
    case "GENERAL_REQUESTS":
    case "GENERAL":
    default:
      return <ClipboardList className="h-4 w-4" />;
  }
};
