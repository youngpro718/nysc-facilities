import { useState } from "react";
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, ArrowLeft, Check, Mail, Lock } from "lucide-react";
import { useSecureAuth } from "@features/auth/hooks/useSecureAuth";
import { toast } from "sonner";
import { SIGNUP_ROLE_OPTIONS } from "@/config/roles";
import { cn } from "@/lib/utils";

interface SimpleSignupFormProps {
  onToggleForm: () => void;
  onSuccess?: () => void;
}

const STEP_LABELS = ["Account", "Details"];

export function SimpleSignupForm({ onToggleForm, onSuccess }: SimpleSignupFormProps) {
  const { secureSignUp, isLoading } = useSecureAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    requestedRole: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const set = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const goTo = (next: number, dir: 'forward' | 'back') => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 180);
  };

  const canAdvance = () => {
    if (step === 0) return formData.email.trim().length > 0 && formData.password.length >= 8;
    if (step === 1) {
      return (
        formData.firstName.trim().length > 0 &&
        formData.lastName.trim().length > 0 &&
        !!formData.requestedRole
      );
    }
    return false;
  };

  const handleSubmit = async () => {
    if (isProcessing || isLoading) return;
    setIsProcessing(true);

    try {
      const data = await secureSignUp(formData.email, formData.password, {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        title: null,
        requested_role: formData.requestedRole,
      });

      if (data?.user) {
        toast.success("Account created. Check your email to verify.");
        setTimeout(() => navigate('/verification-pending'), 0);
        onSuccess?.();
      }
    } catch (error) {
      logger.error('Signup error:', error);
      setIsProcessing(false);
      const msg = getErrorMessage(error) || "";
      if (msg.includes("User already registered")) {
        toast.error("An account with this email already exists.", {
          description: "Try signing in instead.",
          action: { label: "Sign in", onClick: onToggleForm },
        });
      } else {
        toast.error(msg || "Failed to create account. Please try again.");
      }
    }
  };

  const passwordStrength = (() => {
    const p = formData.password;
    if (!p) return null;
    const score = [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
    if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "w-1/4" };
    if (score === 2) return { label: "Fair", color: "bg-amber-500", width: "w-2/4" };
    if (score === 3) return { label: "Good", color: "bg-blue-500", width: "w-3/4" };
    return { label: "Strong", color: "bg-green-500", width: "w-full" };
  })();

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                "bg-muted text-muted-foreground"
              )}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn(
                "text-xs font-medium",
                i === step ? "text-foreground" : "text-muted-foreground"
              )}>{label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={cn(
                "h-px flex-1 mx-3 transition-colors duration-300",
                i < step ? "bg-primary" : "bg-border"
              )} />
            )}
          </div>
        ))}
      </div>

      <div className={cn(
        "transition-all duration-200 ease-out",
        animating && direction === 'forward' ? "opacity-0 translate-x-4" :
        animating && direction === 'back' ? "opacity-0 -translate-x-4" :
        "opacity-100 translate-x-0"
      )}>
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Create your account</h3>
              <p className="text-xs text-muted-foreground">Use your work email.</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="su-email" className="text-xs font-medium">Work email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="su-email"
                    type="email"
                    value={formData.email}
                    onChange={e => set("email", e.target.value)}
                    placeholder="you@nycourts.gov"
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-password" className="text-xs font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="su-password"
                    type="password"
                    value={formData.password}
                    onChange={e => set("password", e.target.value)}
                    placeholder="At least 8 characters"
                    className="pl-9"
                  />
                </div>
                {passwordStrength && (
                  <div className="space-y-1">
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-300", passwordStrength.color, passwordStrength.width)} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{passwordStrength.label} password</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Your details</h3>
              <p className="text-xs text-muted-foreground">
                Court officers with a <span className="font-medium text-foreground">@nycourts.gov</span> email are approved automatically. Other roles wait for a brief admin review.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="su-first" className="text-xs font-medium">First name</Label>
                <Input
                  id="su-first"
                  value={formData.firstName}
                  onChange={e => set("firstName", e.target.value)}
                  placeholder="John"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-last" className="text-xs font-medium">Last name</Label>
                <Input
                  id="su-last"
                  value={formData.lastName}
                  onChange={e => set("lastName", e.target.value)}
                  placeholder="Smith"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Role</Label>
              <div className="space-y-2">
                {SIGNUP_ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => set("requestedRole", role.value)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all duration-150",
                      formData.requestedRole === role.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border bg-background hover:border-primary/40 hover:bg-muted/40"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">{role.label}</span>
                        {formData.requestedRole === role.value && (
                          <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Check className="h-2.5 w-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{role.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        {step > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => goTo(step - 1, 'back')}
            disabled={animating || isProcessing}
            className="h-10 px-3"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        {step < STEP_LABELS.length - 1 ? (
          <Button
            type="button"
            size="sm"
            className="flex-1 h-10 gap-1.5"
            onClick={() => goTo(step + 1, 'forward')}
            disabled={!canAdvance() || animating}
          >
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="flex-1 h-10 gap-1.5"
            onClick={handleSubmit}
            disabled={!canAdvance() || isProcessing || isLoading}
          >
            {isProcessing || isLoading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
              : <>Create account <ArrowRight className="h-4 w-4" /></>
            }
          </Button>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <button type="button" onClick={onToggleForm} className="text-primary hover:underline font-medium">
          Sign in
        </button>
      </p>
    </div>
  );
}
