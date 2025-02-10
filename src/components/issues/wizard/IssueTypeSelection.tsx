
import { Thermometer, Droplet, Zap, Paintbrush, Trash2, WrenchIcon } from "lucide-react";
import { FormData } from "../types/IssueTypes";

interface IssueTypeIcon {
  type: FormData["type"];
  icon: React.ReactNode;
  label: string;
  defaultTitle: string;
  defaultDescription: string;
  contextFields: string[];
  requiredPhotos: number;
}

const issueTypes: IssueTypeIcon[] = [
  {
    type: "HVAC",
    icon: <Thermometer className="h-12 w-12" />,
    label: "HVAC Issue",
    defaultTitle: "HVAC Problem",
    defaultDescription: "Temperature or ventilation issue",
    contextFields: ["temperature", "occupancy_status", "maintenance_history"],
    requiredPhotos: 1
  },
  {
    type: "Leak",
    icon: <Droplet className="h-12 w-12" />,
    label: "Water Leak",
    defaultTitle: "Water Leak",
    defaultDescription: "Water leak or plumbing issue",
    contextFields: ["damage_assessment", "urgency_reason"],
    requiredPhotos: 2
  },
  {
    type: "Electrical",
    icon: <Zap className="h-12 w-12" />,
    label: "Electrical",
    defaultTitle: "Electrical Problem",
    defaultDescription: "Electrical or lighting issue",
    contextFields: ["safety_assessment", "maintenance_history"],
    requiredPhotos: 1
  },
  {
    type: "Plaster",
    icon: <Paintbrush className="h-12 w-12" />,
    label: "Plaster",
    defaultTitle: "Plaster Repair",
    defaultDescription: "Wall or ceiling damage",
    contextFields: ["area_size", "damage_assessment"],
    requiredPhotos: 2
  },
  {
    type: "Cleaning",
    icon: <Trash2 className="h-12 w-12" />,
    label: "Cleaning",
    defaultTitle: "Cleaning Required",
    defaultDescription: "Area needs cleaning or maintenance",
    contextFields: ["area_size", "urgency_reason"],
    requiredPhotos: 1
  },
  {
    type: "Other",
    icon: <WrenchIcon className="h-12 w-12" />,
    label: "Other",
    defaultTitle: "Other Issue",
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
