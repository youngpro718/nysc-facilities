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
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-xl font-semibold">Complete Your Profile</h2>
        <p className="text-muted-foreground">
          Help your colleagues find and connect with you (optional)
        </p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="w-20 h-20">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="text-lg">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <Button
            size="icon"
            variant="outline"
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full"
          >
            <Camera className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-center">
          <p className="font-medium">
            {profile?.first_name} {profile?.last_name}
          </p>
          <p className="text-sm text-muted-foreground">
            {profile?.email}
          </p>
        </div>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select
            value={profileData.department}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, department: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.value} value={dept.value}>
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">
            Job Title
            <span className="text-xs text-muted-foreground ml-2">(Determines your access level)</span>
          </Label>
          <Input
            id="title"
            placeholder="e.g., Supply Clerk, Facilities Manager, Court Aide"
            value={profileData.title}
            onChange={(e) => setProfileData(prev => ({ ...prev, title: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            Your job title will automatically determine what features you can access
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={profileData.phone}
            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>
      </div>

      {/* Access Level Preview */}
      {detectedRole && (
        <Alert className="max-w-md mx-auto border-primary/50 bg-primary/5">
          <Shield className="h-4 w-4 text-primary" />
          <AlertDescription>
            <div className="space-y-2">
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
      <div className="p-4 rounded-lg bg-muted/50 border max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Automatic Access Assignment</p>
            <p className="text-xs text-muted-foreground">
              Your job title determines your access level:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-2">
              <li>• <strong>Supply staff</strong> get full inventory & supply request access</li>
              <li>• <strong>Facilities managers</strong> get building & maintenance access</li>
              <li>• <strong>Court personnel</strong> get court operations access</li>
              <li>• <strong>Standard users</strong> can report issues & make requests</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              {isSaving && "Saving your information..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}