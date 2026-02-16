import { useState, useEffect } from "react";
import { logger } from '@/lib/logger';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, User, Shield, CheckCircle2, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  getRoleFromTitle, 
  getRoleDescriptionFromTitle, 
  getAccessDescriptionFromTitle 
} from "@/utils/titleToRoleMapping";
import { Alert, AlertDescription } from "@/components/ui/alert";

const departments = [
  { value: "admin", label: "Administration" },
  { value: "facilities", label: "Facilities Management" },
  { value: "security", label: "Security" },
  { value: "maintenance", label: "Maintenance" },
  { value: "operations", label: "Operations" },
  { value: "supply", label: "Supply Department" },
  { value: "court", label: "Court Operations" },
  { value: "other", label: "Other" }
];

export function ProfileStep() {
  const { profile } = useAuth();
  const [profileData, setProfileData] = useState({
    department: "",
    title: "",
    phone: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [detectedRole, setDetectedRole] = useState<string | null>(null);
  const [accessDescription, setAccessDescription] = useState<string>("");

  // Detect role based on title
  useEffect(() => {
    if (profileData.title) {
      const role = getRoleFromTitle(profileData.title);
      const roleDesc = getRoleDescriptionFromTitle(profileData.title);
      const accessDesc = getAccessDescriptionFromTitle(profileData.title);
      
      setDetectedRole(roleDesc);
      setAccessDescription(accessDesc);
    } else {
      setDetectedRole(null);
      setAccessDescription("");
    }
  }, [profileData.title]);

  // Auto-save profile data (department, title, phone only — roles are assigned by admin)
  useEffect(() => {
    const saveProfile = async () => {
      if (!profile?.id || isSaving) return;
      
      // Only save if at least one field is filled
      if (!profileData.department && !profileData.title && !profileData.phone) return;

      setIsSaving(true);
      try {
        const updates: Record<string, string> = {
          updated_at: new Date().toISOString()
        };

        if (profileData.department) updates.department = profileData.department;
        if (profileData.title) updates.title = profileData.title;
        if (profileData.phone) updates.phone = profileData.phone;

        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', profile.id);

        if (error) throw error;
        // NOTE: Roles are assigned by admin approval only — not by title during onboarding

      } catch (error) {
        logger.error('Error saving profile:', error);
        toast.error('Failed to save profile information');
      } finally {
        setIsSaving(false);
      }
    };

    // Debounce the save
    const timeoutId = setTimeout(saveProfile, 1000);
    return () => clearTimeout(timeoutId);
  }, [profileData, profile?.id]);

  return (
    <div className="space-y-6 py-2">
      {/* Avatar + Name header */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar className="w-16 h-16">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="text-lg font-semibold">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <Button
            size="icon"
            variant="outline"
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full"
          >
            <Camera className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-lg truncate">
            {profile?.first_name} {profile?.last_name}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {profile?.email}
          </p>
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="department" className="text-sm font-medium">Department</Label>
          <Select
            value={profileData.department}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, department: value }))}
          >
            <SelectTrigger className="h-12 rounded-xl text-base">
              <SelectValue placeholder="Select your department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.value} value={dept.value} className="py-3">
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            Job Title
          </Label>
          <Input
            id="title"
            placeholder="e.g., Supply Clerk, Facilities Manager"
            value={profileData.title}
            onChange={(e) => setProfileData(prev => ({ ...prev, title: e.target.value }))}
            className="h-12 rounded-xl text-base"
          />
          <p className="text-xs text-muted-foreground">
            Determines what features you can access
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={profileData.phone}
            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
            className="h-12 rounded-xl text-base"
          />
        </div>
      </div>

      {/* Access Level Preview */}
      {detectedRole && (
        <Alert className="border-primary/50 bg-primary/5 rounded-xl">
          <Shield className="h-4 w-4 text-primary" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium">
                  Detected Role: <span className="text-primary">{detectedRole}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {accessDescription}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Info about title-based access */}
      <div className="p-4 rounded-xl bg-muted/50 border">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Automatic Access Assignment</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Supply staff</strong> — inventory & supply access</p>
              <p><strong>Facilities managers</strong> — building & maintenance</p>
              <p><strong>Court personnel</strong> — court operations</p>
              <p><strong>Standard users</strong> — issues & requests</p>
            </div>
            {isSaving && (
              <p className="text-xs text-primary font-medium">Saving...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}