import { Button } from "@/components/ui/button";
import { Lightbulb, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "compact";
}

export function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  variant = "default" 
}: EmptyStateProps) {
  if (variant === "compact") {
    return (
      <div className="flex flex-col items-center justify-center text-center py-8 px-4 border border-dashed border-border/60 rounded-xl bg-muted/10">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Lightbulb className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-base font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        {actionLabel && (
          <Button size="sm" className="mt-3 gap-2" onClick={onAction}>
            <Plus className="h-4 w-4" />
            {actionLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden flex flex-col items-center justify-center text-center py-20 px-6 border border-dashed border-border/60 rounded-2xl bg-gradient-to-br from-muted/30 via-background to-muted/20">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-amber-500/5 blur-3xl" />
      </div>
      
      <div className="relative z-10">
        {/* Animated bulb icon */}
        <div className="relative mb-6">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Lightbulb className="h-10 w-10 text-primary" />
          </div>
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '3s' }} />
          <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-amber-400" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
        )}
        
        {actionLabel && (
          <Button 
            size="lg" 
            className="gap-2 shadow-lg shadow-primary/20" 
            onClick={onAction}
          >
            <Plus className="h-5 w-5" />
            {actionLabel}
          </Button>
        )}
        
        <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>LED</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Fluorescent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Incandescent</span>
          </div>
        </div>
      </div>
    </div>
  );
}
