import { useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronRight, PlayCircle } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useTour } from '@/shared/components/help/TourProvider';
import type { OnboardingRoleContent } from "../onboardingContent";

interface CompleteStepProps {
  roleContent: OnboardingRoleContent;
}

export function CompleteStep({ roleContent }: CompleteStepProps) {
  const navigate = useNavigate();
  const { startTourForRoute } = useTour();

  const handleOpenPrimaryAction = () => {
    navigate(roleContent.primaryAction.path);
  };

  const handleOpenSecondaryAction = () => {
    navigate(roleContent.secondaryAction.path);
  };

  const handleStartTour = () => {
    startTourForRoute(roleContent.primaryAction.path);
  };

  return (
    <div className="space-y-8 py-4">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{roleContent.completionTitle}</h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
            {roleContent.completionDescription}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleOpenPrimaryAction}
          className="w-full flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors text-left"
        >
          <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <roleContent.primaryAction.icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{roleContent.primaryAction.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {roleContent.primaryAction.description}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>

        <button
          type="button"
          onClick={handleOpenSecondaryAction}
          className="w-full flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors text-left"
        >
          <div className="shrink-0 w-10 h-10 rounded-lg bg-secondary/60 flex items-center justify-center">
            <roleContent.secondaryAction.icon className="w-5 h-5 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{roleContent.secondaryAction.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {roleContent.secondaryAction.description}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </div>

      <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <PlayCircle className="h-4 w-4 text-primary" />
          <span>Want a guided walkthrough?</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Start a short tour of the page you’ll use most. It’s a quicker way to learn the parts that matter to your role.
        </p>
        <Button type="button" variant="secondary" className="w-full rounded-xl" onClick={handleStartTour}>
          Start guided tour
        </Button>
      </div>

      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-sm font-medium text-primary text-center">
          Account Verified
        </p>
        <p className="text-xs text-muted-foreground text-center mt-1">
          {roleContent.focusPoints[0]}
        </p>
      </div>
    </div>
  );
}