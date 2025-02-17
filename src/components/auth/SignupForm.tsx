
import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Building2, Loader2, User, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || !department || !firstName || !lastName || !title) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            department,
            title
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes("User already registered")) {
          toast.error("This email is already registered", {
            description: "Please sign in instead or use a different email address.",
            action: {
              label: "Sign In",
              onClick: onToggleForm
            }
          });
          return;
        }
        throw signUpError;
      }
      
      // Redirect to pending verification page
      navigate("/verification-pending");
    } catch (error: any) {
      console.error("Auth error:", error);
      
      let errorMessage = "Signup failed";
      try {
        const errorBody = JSON.parse(error.body);
        errorMessage = errorBody.message || errorMessage;
      } catch {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSignup}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-white">
            First Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-5 w-5 text-white/50" />
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="bg-white/10 border-white/20 text-white pl-10 placeholder:text-white/50"
              placeholder="Enter your first name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-white">
            Last Name
          </Label>
          <div className="relative">
            <Users className="absolute left-3 top-2.5 h-5 w-5 text-white/50" />
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="bg-white/10 border-white/20 text-white pl-10 placeholder:text-white/50"
              placeholder="Enter your last name"
            />
          </div>
        </div>
      </div>

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
        <Label htmlFor="title" className="text-white">
          Job Title
        </Label>
        <div className="relative">
          <Users className="absolute left-3 top-2.5 h-5 w-5 text-white/50" />
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white/10 border-white/20 text-white pl-10 placeholder:text-white/50"
            placeholder="Enter your job title"
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
