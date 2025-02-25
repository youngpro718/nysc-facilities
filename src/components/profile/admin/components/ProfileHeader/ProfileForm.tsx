import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Globe2, Languages } from "lucide-react";
import { Profile } from "../../types";

interface ProfileFormProps {
  profile: Profile | null;
  isEditing: boolean;
  onUpdate: (field: keyof Profile, value: string) => void;
}

export function ProfileForm({ profile, isEditing, onUpdate }: ProfileFormProps) {
  const fields = [
    { key: "first_name" as const, label: "First Name" },
    { key: "last_name" as const, label: "Last Name" },
    { key: "email" as const, label: "Email" },
    { key: "phone" as const, label: "Phone" },
    { key: "title" as const, label: "Title" },
    { key: "department" as const, label: "Department" },
  ];

  const preferencesFields = [
    {
      key: "time_zone" as const,
      label: "Time Zone",
      icon: Globe2,
    },
    {
      key: "language" as const,
      label: "Language",
      icon: Languages,
    },
  ];

  if (!profile) return null;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <div className="text-sm font-medium mb-1.5">{label}</div>
            {isEditing ? (
              <Input
                value={profile[key] || ""}
                onChange={(e) => onUpdate(key, e.target.value)}
                placeholder={label}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                {profile[key] || "Not provided"}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">About</h3>
        {isEditing ? (
          <Textarea
            value={profile.bio || ""}
            onChange={(e) => onUpdate("bio", e.target.value)}
            placeholder="Tell us about yourself"
            className="min-h-[100px]"
          />
        ) : (
          <div className="text-sm text-muted-foreground">
            {profile.bio || "No bio provided"}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Preferences</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {preferencesFields.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              {isEditing ? (
                <Input
                  value={profile[key] || ""}
                  onChange={(e) => onUpdate(key, e.target.value)}
                  placeholder={label}
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  {profile[key] || "Not set"}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
