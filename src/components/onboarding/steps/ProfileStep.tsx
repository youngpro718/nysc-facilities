import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const departments = [
  { value: "admin", label: "Administration" },
  { value: "facilities", label: "Facilities Management" },
  { value: "security", label: "Security" },
  { value: "maintenance", label: "Maintenance" },
  { value: "operations", label: "Operations" },
  { value: "other", label: "Other" }
];

export function ProfileStep() {
  const { profile } = useAuth();
  const [profileData, setProfileData] = useState({
    department: "",
    title: "",
    phone: ""
  });

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
          <Label htmlFor="title">Job Title</Label>
          <Input
            id="title"
            placeholder="e.g., Facilities Coordinator"
            value={profileData.title}
            onChange={(e) => setProfileData(prev => ({ ...prev, title: e.target.value }))}
          />
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

      <div className="p-4 rounded-lg bg-muted/50 border max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-primary mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Profile Benefits</p>
            <p className="text-xs text-muted-foreground">
              A complete profile helps colleagues identify you and improves team coordination.
              You can always update this information later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}