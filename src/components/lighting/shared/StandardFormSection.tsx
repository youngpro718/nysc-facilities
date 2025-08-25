import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StandardFormSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: "default" | "muted" | "accent";
}

export function StandardFormSection({
  title,
  description,
  icon,
  children,
  className,
  variant = "default"
}: StandardFormSectionProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "muted":
        return "bg-muted/30 border-muted";
      case "accent":
        return "bg-primary/5 border-primary/20";
      default:
        return "";
    }
  };

  return (
    <Card className={cn(getVariantStyles(), className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </div>
        {description && (
          <CardDescription className="text-sm">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}