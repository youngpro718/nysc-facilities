import { ReactNode } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LightStatus } from "@/types/lighting";

interface BaseLightingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  trigger?: ReactNode;
  className?: string;
  status?: LightStatus;
  contextInfo?: {
    label: string;
    value: string;
    icon?: ReactNode;
  }[];
}

export function BaseLightingDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  trigger,
  className,
  status,
  contextInfo
}: BaseLightingDialogProps) {
  const getStatusColor = (status?: LightStatus) => {
    switch (status) {
      case "functional":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "non_functional":
        return "bg-red-50 text-red-700 border-red-200";
      case "maintenance_needed":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "scheduled_replacement":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "pending_maintenance":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-3">
          <span>{title}</span>
          {status && (
            <Badge 
              variant="outline" 
              className={cn("capitalize text-xs", getStatusColor(status))}
            >
              {status.replace('_', ' ')}
            </Badge>
          )}
        </div>
      }
      description={description}
      className={cn("max-w-2xl", className)}
    >
      <div className="space-y-6">
        {contextInfo && contextInfo.length > 0 && (
          <Card className="bg-muted/30 border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Context Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {contextInfo.map((info, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {info.icon}
                    <span className="text-muted-foreground">{info.label}:</span>
                    <span className="font-medium">{info.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </ResponsiveDialog>
  );
}