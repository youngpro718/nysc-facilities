
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus } from "lucide-react";
import { signUpWithEmail } from "@/services/supabase/authService";
import { toast } from "sonner";

interface SimpleSignupFormProps {
  onToggleForm: () => void;
}

export function SimpleSignupForm({ onToggleForm }: SimpleSignupFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

      console.log('Starting signup process for:', formData.email);

      const userData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim()
      };

      console.log('Calling signUpWithEmail with data:', userData);
      const result = await signUpWithEmail(formData.email, formData.password, userData);
      console.log('Signup result:', result);
      
      toast.success("Account created! Please check your email to verify your account.");
      
    } catch (error: any) {
      console.error("Signup error details:", {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      let errorMessage = "Failed to create account. Please try again.";
      
      if (error.message?.includes("duplicate key value violates unique constraint")) {
        errorMessage = "An account with this email already exists. Please try signing in instead.";
      } else if (error.message?.includes("Database error")) {
        errorMessage = "There was a database error. Please try again in a moment.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create Account
        </CardTitle>
        <CardDescription>
          Get started quickly with just the basics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="John"
                disabled={loading}
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
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="john.smith@example.com"
              disabled={loading}
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
              disabled={loading}
              required
              minLength={6}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
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
              disabled={loading}
            >
              Sign in
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
