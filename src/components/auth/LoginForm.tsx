
import { FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSecureAuth } from '@/hooks/security/useSecureAuth';

interface LoginFormProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  onToggleForm: () => void;
}

export const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  setLoading,
  onToggleForm,
}: LoginFormProps) => {
  const { secureSignIn, isLoading: authLoading } = useSecureAuth();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      
      await secureSignIn(email, password);
      
      toast.success("Welcome back!", {
        description: "You've successfully signed in."
      });
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleLogin}>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-700">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            placeholder="Enter your email"
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-700">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant="link"
          className="text-slate-600 hover:text-slate-800"
          onClick={() => toast.info("Please contact your administrator to reset your password")}
        >
          Forgot password?
        </Button>
      </div>

      <div className="space-y-4">
        <Button
          type="submit"
          variant="default"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Sign In"
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full text-foreground"
          onClick={onToggleForm}
          disabled={loading}
        >
          Need an account? Create one
        </Button>
      </div>
    </form>
  );
};
