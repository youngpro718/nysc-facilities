
import { Lightbulb, Bolt, Droplet, Building2, Key, Thermometer } from "lucide-react";
import { StandardizedIssueType } from "../constants/issueTypes";

export const getIssueTypeIcon = (type: StandardizedIssueType) => {
  switch (type) {
    case "LIGHTING_NEEDS":
      return <Lightbulb className="h-4 w-4" />;
    case "ELECTRICAL_NEEDS":
      return <Bolt className="h-4 w-4" />;
    case "PLUMBING_NEEDS":
      return <Droplet className="h-4 w-4" />;
    case "BUILDING_SYSTEMS":
      return <Building2 className="h-4 w-4" />;
    case "ACCESS_REQUEST":
      return <Key className="h-4 w-4" />;
    case "CLIMATE_CONTROL":
      return <Thermometer className="h-4 w-4" />;
    default:
      return <Building2 className="h-4 w-4" />;
  }
};

