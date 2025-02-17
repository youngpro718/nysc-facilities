
import { FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Building2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SignupFormProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  department: string;
  setDepartment: (value: string) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  onToggleForm: () => void;
}

export const SignupForm = ({
  email,
  setEmail,
  password,
  setPassword,
  department,
  setDepartment,
  loading,
  setLoading,
  onToggleForm,
}: SignupFormProps) => {
  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || !department) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      
      // First create the user without metadata
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });

      if (signUpError) throw signUpError;

      if (user) {
        // Then update the user's metadata
        const { error: updateError } = await supabase.auth.updateUser({
          data: { department }
        });

        if (updateError) throw updateError;
      }
      
      toast.success("Check your email for the confirmation link!", {
        description: "Your verification request has been submitted and is pending review."
      });
      
      onToggleForm();
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSignup}>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-white/50" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/10 border-white/20 text-white pl-10 placeholder:text-white/50"
            placeholder="Enter your email"
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-white">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-white/50" />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white/10 border-white/20 text-white pl-10 placeholder:text-white/50"
            placeholder="Enter your password"
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="department" className="text-white">
          Department
        </Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-white/50" />
          <Input
            id="department"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="bg-white/10 border-white/20 text-white pl-10 placeholder:text-white/50"
            placeholder="Enter your department"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Button
          type="submit"
          className="w-full bg-white text-courthouse hover:bg-white/90 transition-colors"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Create Account"
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full text-white hover:bg-white/10 transition-colors"
          onClick={onToggleForm}
          disabled={loading}
        >
          Already have an account? Sign in
        </Button>
      </div>
    </form>
  );
};
