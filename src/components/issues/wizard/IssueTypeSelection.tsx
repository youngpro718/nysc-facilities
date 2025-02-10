
import { Thermometer, Droplet, Zap, Construction, Wrench, CleaningIcon } from "lucide-react";
import { FormData, IssueType } from "../types/IssueTypes";

interface IssueTypeIcon {
  type: IssueType;
  icon: React.ReactNode;
  label: string;
  defaultTitle: string;
  defaultDescription: string;
  contextFields: string[];
  requiredPhotos: number;
}

const issueTypes: IssueTypeIcon[] = [
  {
    type: "CLIMATE_CONTROL",
    icon: <Thermometer className="h-12 w-12" />,
    label: "Climate Control",
    defaultTitle: "Climate Control Issue",
    defaultDescription: "Temperature or ventilation issue",
    contextFields: ["area_affected", "current_condition"],
    requiredPhotos: 1
  },
  {
    type: "LEAK",
    icon: <Droplet className="h-12 w-12" />,
    label: "Water Leak",
    defaultTitle: "Water Leak",
    defaultDescription: "Water leak or plumbing issue",
    contextFields: ["damage_assessment", "urgency_reason"],
    requiredPhotos: 2
  },
  {
    type: "ELECTRICAL_NEEDS",
    icon: <Zap className="h-12 w-12" />,
    label: "Electrical",
    defaultTitle: "Electrical Issue",
    defaultDescription: "Electrical or power issue",
    contextFields: ["safety_assessment", "maintenance_history"],
    requiredPhotos: 1
  },
  {
    type: "CEILING",
    icon: <Construction className="h-12 w-12" />,
    label: "Ceiling",
    defaultTitle: "Ceiling Repair",
    defaultDescription: "Ceiling damage or issue",
    contextFields: ["area_size", "damage_assessment"],
    requiredPhotos: 2
  },
  {
    type: "CLEANING_REQUEST",
    icon: <CleaningIcon className="h-12 w-12" />,
    label: "Cleaning",
    defaultTitle: "Cleaning Required",
    defaultDescription: "Area needs cleaning or maintenance",
    contextFields: ["area_size", "urgency_reason"],
    requiredPhotos: 1
  },
  {
    type: "GENERAL_REQUESTS",
    icon: <Wrench className="h-12 w-12" />,
    label: "General Request",
    defaultTitle: "General Maintenance Request",
    defaultDescription: "Other maintenance or facility issue",
    contextFields: [],
    requiredPhotos: 1
  },
];

interface IssueTypeSelectionProps {
  onTypeSelect: (type: IssueTypeIcon) => void;
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

export { issueTypes };
