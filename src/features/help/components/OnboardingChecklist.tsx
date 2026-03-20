import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useOnboardingChecklist } from '../hooks/useOnboardingChecklist';
import { cn } from '@/lib/utils';

export function OnboardingChecklist() {
  const { steps, isLoading, completedCount, totalCount, progress, completeStep, isCompletingStep } =
    useOnboardingChecklist();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Complete these steps to get familiar with the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!steps || steps.length === 0) {
    return null;
  }

  const allCompleted = completedCount === totalCount;

  return (
    <Card className={cn(allCompleted && 'border-green-200 bg-green-50/50')}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Getting Started
              {allCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            </CardTitle>
            <CardDescription>
              {allCompleted
                ? 'All steps completed! You\'re ready to go.'
                : `${completedCount} of ${totalCount} steps completed`}
            </CardDescription>
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            {Math.round(progress)}%
          </div>
        </div>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg transition-colors',
                step.completed ? 'bg-muted/50' : 'hover:bg-muted/50'
              )}
            >
              <button
                onClick={() => !step.completed && completeStep(step.step_key)}
                disabled={step.completed || isCompletingStep}
                className="mt-0.5 shrink-0 disabled:cursor-default"
              >
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium',
                    step.completed && 'text-muted-foreground line-through'
                  )}
                >
                  {step.step_title}
                </p>
                {step.step_description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.step_description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
