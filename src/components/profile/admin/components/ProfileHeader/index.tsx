import { useAdminProfile } from "../../hooks/useAdminProfile";
import { useAdminStats } from "../../hooks/useAdminStats";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmergencyContactForm } from "./EmergencyContactForm";
import { Profile } from "../../types";

export function AdminProfileHeader() {
  const { 
    profile,
    editedProfile,
    setEditedProfile,
    isLoading: profileLoading,
    error: profileError,
    isEditing
  } = useAdminProfile();

  const { 
    stats,
    isLoading: statsLoading,
    error: statsError 
  } = useAdminStats();

  if (profileLoading || statsLoading) {
    return <LoadingSkeleton />;
  }

  if (profileError || statsError) {
    return (
      <Card className="p-6">
        <div className="text-destructive">
          {profileError || statsError}
        </div>
      </Card>
    );
  }

  const updateEmergencyContact = (field: keyof Profile["emergency_contact"], value: string) => {
    if (!editedProfile?.emergency_contact) return;
    
    setEditedProfile({
      ...editedProfile,
      emergency_contact: {
        ...editedProfile.emergency_contact,
        [field]: value
      }
    });
  };

  const getFullName = (profile?: Profile) => {
    if (!profile) return "";
    return [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Admin User";
  };

  return (
    <Card className="p-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{getFullName(profile)}</h2>
            <p className="text-muted-foreground">{profile?.email}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Admin</Badge>
            <Badge variant="outline">{profile?.department || "No Department"}</Badge>
            <Badge variant="outline">{profile?.title || "No Title"}</Badge>
          </div>

          {editedProfile && (
            <EmergencyContactForm
              emergencyContact={editedProfile.emergency_contact}
              isEditing={isEditing}
              onUpdate={updateEmergencyContact}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Active Users"
            value={stats.activeUsers}
          />
          <StatCard
            label="Pending Issues"
            value={stats.pendingIssues}
          />
          <StatCard
            label="Total Keys"
            value={stats.totalKeys}
          />
          <StatCard
            label="Buildings"
            value={stats.managedBuildings}
          />
        </div>
      </div>
    </Card>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-sm font-medium text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">
        {value}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="p-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border p-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16 mt-1" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
