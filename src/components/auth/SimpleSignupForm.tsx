import { useState } from "react";
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus } from "lucide-react";
import { useSecureAuth } from "@/hooks/security/useSecureAuth";
import { toast } from "sonner";
import { SIGNUP_ROLE_OPTIONS } from "@/config/roles";

interface SimpleSignupFormProps {
  onToggleForm: () => void;
  onSuccess?: () => void;
}

export function SimpleSignupForm({ onToggleForm, onSuccess }: SimpleSignupFormProps) {
  const { secureSignUp, isLoading } = useSecureAuth();
  const navigate = useNavigate();
  // Removed personnel picker; users will type their name
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    password: "",
    requestedRole: "standard"
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Prevent double submissions

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple rapid submissions
    if (isSubmitted || isProcessing || isLoading) return;
    
    setIsProcessing(true);
    setIsSubmitted(true);

    try {
      // Basic validation
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        toast.error("Please enter your first and last name");
        return;
      }
      
      if (!formData.email.trim()) {
        toast.error("Please enter your email address");
        return;
      }
      
      if (formData.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }

      const userData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        title: formData.title.trim() || null,
        requested_role: formData.requestedRole
      };

      const data = await secureSignUp(formData.email, formData.password, userData);

      if (data?.user) {
        // Set onboarding flags to trigger onboarding after verification for this user only
        try {
          localStorage.setItem('ONBOARD_AFTER_SIGNUP', 'true');
          localStorage.setItem('ONBOARD_AFTER_SIGNUP_EMAIL', formData.email);
        } catch { /* no-op */ }

        if (!data.user.email_confirmed_at) {
          toast.success("Account created! Please check your email to verify your account.");
        } else {
          toast.success("Account created successfully!");
        }

        // Navigate to verification pending page
        setTimeout(() => navigate('/verification-pending'), 0);
        onSuccess?.();
      }
      
    } catch (error) {
      logger.error('Signup error:', error);
      
      // Reset states on error so user can try again
      setIsSubmitted(false);
      setIsProcessing(false);
      
      let errorMessage = "Failed to create account. Please try again.";
      
      if (getErrorMessage(error)?.includes('duplicate key') || getErrorMessage(error)?.includes('unique_user_role')) {
        errorMessage = "Account processing issue detected. Please try again or contact support if this persists.";
      } else if (getErrorMessage(error)?.includes("User already registered")) {
        errorMessage = "An account with this email already exists. Please try signing in instead.";
      } else if (getErrorMessage(error)?.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (getErrorMessage(error)?.includes("Password")) {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (getErrorMessage(error)) {
        errorMessage = getErrorMessage(error);
      }
      
      toast.error(errorMessage);
    } finally {
      // Keep processing flag active for a short time to prevent rapid resubmissions
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  return (
    <Card className="w-full bg-transparent border-transparent shadow-none">
      <CardHeader className="space-y-1 text-center p-0 pb-2">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create Account
        </CardTitle>
        <CardDescription>
          Get started quickly with just the basics
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name fields only; personnel lookup removed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="John"
                disabled={isLoading || isProcessing}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Smith"
                disabled={isLoading || isProcessing}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              Job Title
              <span className="text-xs text-muted-foreground ml-2">(Optional - determines access)</span>
            </Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="e.g., Supply Clerk, Facilities Manager"
              disabled={isLoading || isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              Your title will determine what features you can access
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="john.smith@example.com"
              disabled={isLoading || isProcessing}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="At least 6 characters"
              disabled={isLoading || isProcessing}
              required
              minLength={6}
            />
          </div>

          {/* Account Type Selection */}
          <div className="space-y-3">
            <Label className="font-medium">Account Type</Label>
            <p className="text-xs text-muted-foreground">
              Select the type of account that best describes your role. An administrator will review and approve your selection.
            </p>
            <RadioGroup 
              value={formData.requestedRole} 
              onValueChange={(value) => handleInputChange("requestedRole", value)}
              disabled={isLoading || isProcessing}
            >
              <div className="space-y-2">
                {SIGNUP_ROLE_OPTIONS.map((role) => (
                  <div key={role.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={role.value} id={`role-${role.value}`} className="mt-0.5" />
                    <div className="flex-1 space-y-0.5">
                      <Label htmlFor={`role-${role.value}`} className="font-medium cursor-pointer">
                        {role.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || isSubmitted || isProcessing}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <button
              type="button"
              onClick={onToggleForm}
              className="text-primary hover:underline font-medium"
              disabled={isLoading || isProcessing}
            >
              Sign in
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

