import { Mail, Phone, Building, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Reporter {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  title?: string;
}

interface ReporterProfileProps {
  reporter: Reporter;
}

export function ReporterProfile({ reporter }: ReporterProfileProps) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h5 className="text-sm font-medium">
                {reporter.first_name} {reporter.last_name}
              </h5>
              {reporter.title && (
                <p className="text-xs text-muted-foreground">
                  {reporter.title}
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              <span>{reporter.email}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`mailto:${reporter.email}`)}
            className="h-8 px-2"
          >
            <Mail className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}