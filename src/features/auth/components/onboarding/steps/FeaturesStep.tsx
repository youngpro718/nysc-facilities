import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import type { OnboardingRoleContent } from "../onboardingContent";

interface FeaturesStepProps {
  roleContent: OnboardingRoleContent;
}

export function FeaturesStep({ roleContent }: FeaturesStepProps) {
  return (
    <div className="space-y-6 py-2">
      <div className="text-center space-y-2">
        <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
          Most relevant for {roleContent.label}
        </Badge>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          What you’ll use most
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {roleContent.description}
        </p>
      </div>

      <div className="space-y-2">
        {roleContent.highlights.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <div
              key={feature.title}
              className="flex items-start gap-3 p-4 rounded-xl border bg-card active:bg-accent/50 transition-colors"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <IconComponent className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-medium text-sm">{feature.title}</p>
                <p className="text-xs text-muted-foreground leading-snug">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border bg-muted/40 p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span>We only show what matters for your role</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          You can always open Help later for a deeper walkthrough, but you do not need to learn every module up front.
        </p>
      </div>
    </div>
  );
}