import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SIGNUP_ROLE_OPTIONS } from "@/config/roles";
import { TIMEOUTS } from '@/config';

interface AdminAddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface CreatedUser {
  email: string;
  password: string;
  name: string;
}

export function AdminAddUserDialog({ open, onOpenChange, onSuccess }: AdminAddUserDialogProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    title: "",
    requestedRole: "standard",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedUser | null>(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            title: form.title.trim() || undefined,
            requested_role: form.requestedRole,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered") || signUpError.message.includes("already been registered")) {
          throw new Error("An account with this email already exists.");
        }
        throw signUpError;
      }

      if (!data.user) {
        throw new Error("Account creation failed. Please try again.");
      }

      setCreated({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
      });

      toast.success(`Account created for ${form.firstName.trim()} ${form.lastName.trim()}`);
      onSuccess();
    } catch (err) {
      logger.error("[AdminAddUserDialog] Error creating user:", err);
      setError(err instanceof Error ? err.message : "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!created) return;
    const text = `NYSC Facilities Hub — Account Created\n\nEmail: ${created.email}\nPassword: ${created.password}\n\nPlease sign in at ${window.location.origin}/login and change your password after first login.`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Credentials copied to clipboard");
      setTimeout(() => setCopied(false), TIMEOUTS.copyConfirmation);
    });
  };

  const handleClose = () => {
    setForm({ firstName: "", lastName: "", email: "", password: "", title: "", requestedRole: "standard" });
    setError("");
    setCreated(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!created ? (
          <>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create an account on behalf of a staff member. They will need to verify their email before logging in.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="add-firstName">First Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="add-firstName"
                    value={form.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder="Jane"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="add-lastName">Last Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="add-lastName"
                    value={form.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder="Smith"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-email">Email Address <span className="text-destructive">*</span></Label>
                <Input
                  id="add-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="jane.smith@example.com"
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-title">Job Title <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input
                  id="add-title"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g., Court Aide, Facilities Manager"
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-role">Requested Role</Label>
                <Select value={form.requestedRole} onValueChange={(v) => handleChange("requestedRole", v)} disabled={loading}>
                  <SelectTrigger id="add-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIGNUP_ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">You can change the final role during approval.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-password">Temporary Password <span className="text-destructive">*</span></Label>
                <Input
                  id="add-password"
                  type="text"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Min. 6 characters"
                  disabled={loading}
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">The user should change this after their first login.</p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Account"}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Account Created
              </DialogTitle>
              <DialogDescription>
                {created.name}'s account has been created. Share the credentials below — they must verify their email before logging in, then you'll approve them in Admin Center.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border bg-muted/50 p-4 space-y-1 text-sm font-mono">
              <p><span className="text-muted-foreground">Email:</span> {created.email}</p>
              <p><span className="text-muted-foreground">Password:</span> {created.password}</p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleCopyCredentials} className="gap-2">
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Credentials"}
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
