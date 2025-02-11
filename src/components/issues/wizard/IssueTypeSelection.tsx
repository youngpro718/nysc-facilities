
import { Thermometer, Droplet, Zap, Construction, Wrench, Brush } from "lucide-react";
import { FormData, IssueType } from "../types/IssueTypes";

export const issueTypes = [
  {
    type: "CLIMATE_CONTROL" as IssueType,
    icon: <Thermometer className="h-12 w-12" />,
    label: "Climate Control",
    defaultTitle: "Climate Control Issue",
    defaultDescription: "Temperature or ventilation issue"
  },
  {
    type: "LEAK" as IssueType,
    icon: <Droplet className="h-12 w-12" />,
    label: "Water Leak",
    defaultTitle: "Water Leak",
    defaultDescription: "Water leak or plumbing issue"
  },
  {
    type: "ELECTRICAL_NEEDS" as IssueType,
    icon: <Zap className="h-12 w-12" />,
    label: "Electrical",
    defaultTitle: "Electrical Issue",
    defaultDescription: "Electrical or power issue"
  },
  {
    type: "CEILING" as IssueType,
    icon: <Construction className="h-12 w-12" />,
    label: "Ceiling",
    defaultTitle: "Ceiling Issue",
    defaultDescription: "Ceiling damage or repair needed"
  },
  {
    type: "CLEANING_REQUEST" as IssueType,
    icon: <Brush className="h-12 w-12" />,
    label: "Cleaning",
    defaultTitle: "Cleaning Request",
    defaultDescription: "Area needs cleaning"
  },
  {
    type: "GENERAL_REQUESTS" as IssueType,
    icon: <Wrench className="h-12 w-12" />,
    label: "General",
    defaultTitle: "General Maintenance",
    defaultDescription: "General maintenance or repair needed"
  }
];

interface IssueTypeSelectionProps {
  onTypeSelect: (type: typeof issueTypes[number]) => void;
}

export function IssueTypeSelection({ onTypeSelect }: IssueTypeSelectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4 px-2 py-4">
      {issueTypes.map((issueType) => (
        <button
          key={issueType.type}
          onClick={() => onTypeSelect(issueType)}
          className="flex flex-col items-center justify-center p-6 space-y-3 rounded-lg border-2 border-muted hover:border-primary transition-colors active:bg-primary/10"
        >
          <div className="text-primary">
            {issueType.icon}
          </div>
          <span className="text-sm font-medium text-center">
            {issueType.label}
          </span>
        </button>
      ))}
    </div>
  );
}
