import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StandardFormSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  variant?: string;
}

export function StandardFormSection({ 
  title, 
  description, 
  icon, 
  children 
}: StandardFormSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}