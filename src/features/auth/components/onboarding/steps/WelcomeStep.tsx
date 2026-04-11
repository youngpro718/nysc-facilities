import { CheckCircle2, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OnboardingRoleContent } from "../onboardingContent";

interface WelcomeStepProps {
  roleContent: OnboardingRoleContent;
}

export function WelcomeStep({ roleContent }: WelcomeStepProps) {
  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center bg-primary/10">
          <ClipboardList className="w-10 h-10 text-primary" />
        </div>
        <div className="space-y-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
            Tailored for {roleContent.label}
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome to your workspace
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
            {roleContent.intro}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Start with these three
          </p>
          <div className="mt-3 space-y-3">
            {roleContent.focusPoints.map((point) => (
              <div key={point} className="flex items-start gap-3 rounded-xl bg-muted/30 p-3">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm leading-relaxed text-foreground">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
        <span>Your view is trimmed to what matters for your role</span>
      </div>
    </div>
  );
}