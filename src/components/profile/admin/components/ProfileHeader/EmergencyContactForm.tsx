import { Input } from "@/components/ui/input";
import { EmergencyContact } from "../../types";

interface EmergencyContactFormProps {
  emergencyContact?: EmergencyContact;
  isEditing: boolean;
  onUpdate: (field: string, value: string) => void;
}

export function EmergencyContactForm({
  emergencyContact,
  isEditing,
  onUpdate,
}: EmergencyContactFormProps) {
  const fields = [
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "relationship", label: "Relationship" },
  ];

  if (!isEditing && !emergencyContact) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Emergency Contact</h3>
      <div className="grid gap-4">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <div className="text-sm font-medium mb-1.5">{label}</div>
            {isEditing ? (
              <Input
                value={emergencyContact?.[key] || ""}
                onChange={(e) => onUpdate(key, e.target.value)}
                placeholder={label}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                {emergencyContact?.[key] || "Not provided"}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
