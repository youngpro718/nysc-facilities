import { useState, useEffect } from "react";
import { User } from "./types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { SYSTEM_ROLES, getRoleLabel } from "@/config/roles";
import { toast } from "sonner";
import { Loader2, User as UserIcon, Mail, Briefcase, Building2, Shield, AlertTriangle, Unlock } from "lucide-react";
import { useRateLimitManager } from "@/hooks/security/useRateLimitManager";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSave: (userId: string, updates: any) => void;
}

export function EditUserDialog({ open, onOpenChange, user, onSave }: EditUserDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [accessLevel, setAccessLevel] = useState("");
  const [departments, setDepartments] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [initialRole, setInitialRole] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const { resetLoginAttempts } = useRateLimitManager();

  useEffect(() => {
    if (user && open) {
      const userRole = (user as any).role || user.access_level || "standard";
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setTitle(user.title || "");
      setDepartmentId((user as any).department_id || "");
      setAccessLevel(userRole);
      setInitialRole(userRole);
      setSaving(false);
      loadDepartments();
    }
  }, [user, open]);

  const loadDepartments = async () => {
    const { data } = await supabase
      .from('departments')
      .select('id, name')
      .order('name');
    
    if (data) setDepartments(data);
  };

  const handleUnlockAccount = async () => {
    if (!user?.email) return;
    
    setUnlocking(true);
    try {
      const success = await resetLoginAttempts(user.email);
      
      if (success) {
        toast.success('Account Unlocked', {
          description: `Login attempts reset for ${user.email}`
        });
      } else {
        toast.error('Failed to unlock account');
      }
    } catch (error: any) {
      console.error('Error unlocking account:', error);
      toast.error('Failed to unlock account', {
        description: error.message
      });
    } finally {
      setUnlocking(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const updates: any = {};
    const changes: string[] = [];
    
    if (firstName !== user.first_name) {
      updates.first_name = firstName;
      changes.push("first name");
    }
    if (lastName !== user.last_name) {
      updates.last_name = lastName;
      changes.push("last name");
    }
    if (email !== user.email) {
      updates.email = email;
      changes.push("email");
    }
    if (title !== user.title) {
      updates.title = title;
      changes.push("title");
    }
    if (departmentId !== (user as any).department_id) {
      updates.department_id = departmentId;
      changes.push("department");
    }
    
    // Save as role instead of access_level
    const roleChanged = accessLevel !== initialRole;
    if (roleChanged) {
      updates.role = accessLevel;
      changes.push(`role to ${getRoleLabel(accessLevel)}`);
    }

    if (changes.length === 0) {
      toast.info("No changes to save");
      return;
    }

    setSaving(true);
    const userName = `${firstName} ${lastName}`.trim() || email;
    
    toast.loading(`Saving changes for ${userName}...`, { id: 'save-user' });

    try {
      await onSave(user.id, updates);
      
      toast.success(
        `✅ Updated ${changes.join(", ")} for ${userName}!`,
        { id: 'save-user' }
      );
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(`❌ Failed to update user`, { id: 'save-user' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const roleChanged = accessLevel !== initialRole;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Edit User Profile
          </DialogTitle>
          <DialogDescription>
            Update user information and role assignment. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-3"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Court Clerk, Facilities Manager"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Department
            </Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prominent Role Selector */}
          <div className={`space-y-2 p-4 rounded-lg border-2 transition-all ${
            roleChanged 
              ? 'bg-primary/5 border-primary' 
              : 'bg-muted/30 border-muted'
          }`}>
            <Label htmlFor="accessLevel" className="flex items-center gap-2 text-base font-semibold">
              <Shield className="h-5 w-5" />
              User Role
              {roleChanged && (
                <Badge variant="default" className="ml-2">Changed</Badge>
              )}
            </Label>
            <Select value={accessLevel} onValueChange={setAccessLevel}>
              <SelectTrigger className="h-11 text-base font-medium border-2">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {SYSTEM_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value} className="text-base py-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${
                        role.color === 'red' ? 'bg-red-500' :
                        role.color === 'blue' ? 'bg-blue-500' :
                        role.color === 'green' ? 'bg-green-500' :
                        role.color === 'purple' ? 'bg-purple-500' :
                        role.color === 'orange' ? 'bg-orange-500' :
                        'bg-gray-500'
                      }`} />
                      <div>
                        <div className="font-semibold">{role.label}</div>
                        <div className="text-xs text-muted-foreground">{role.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {roleChanged && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Role will change from <strong>{getRoleLabel(initialRole)}</strong> to <strong>{getRoleLabel(accessLevel)}</strong>
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <div className="flex gap-2 flex-1">
            <Button 
              variant="secondary"
              onClick={handleUnlockAccount}
              disabled={unlocking || saving}
              className="gap-2"
            >
              {unlocking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Unlocking...
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" />
                  Unlock Account
                </>
              )}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="min-w-[120px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
