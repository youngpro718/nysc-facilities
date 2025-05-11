
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { SignupForm } from "./SignupForm";

export interface AuthFormProps {
  isLogin: boolean;
  setIsLogin: (isLogin: boolean) => void;
}

export function AuthForm({ isLogin, setIsLogin }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      await signIn(email, password);
    } catch (error) {
      // Error is already handled in signIn
    } finally {
      setLoading(false);
    }
  };

  if (!isLogin) {
    return (
      <SignupForm
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        loading={loading}
        setLoading={setLoading}
        onToggleForm={() => setIsLogin(true)}
      />
    );
  }

  return (
    <form onSubmit={handleLoginSubmit} className="space-y-4 w-full">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={loading}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          disabled={loading}
          required
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
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      <div className="text-center text-sm">
        <button
          type="button"
          onClick={() => setIsLogin(false)}
          className="text-primary hover:underline"
          disabled={loading}
        >
          Need an account? Sign up
        </button>
      </div>
    </form>
  );
}
