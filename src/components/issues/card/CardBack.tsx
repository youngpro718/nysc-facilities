
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Issue } from "../types/IssueTypes";
import { format } from "date-fns";
import { IssuePhotos } from "./IssuePhotos";
import { Info, Settings, History, Camera, Database, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CardBackProps {
  issue: Issue;
}

export function CardBack({ issue }: CardBackProps) {
  return (
    <Card className="absolute w-full h-full backface-hidden rotate-y-180 bg-card/95 backdrop-blur-[2px]">
      <CardHeader className="flex-none p-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5" />
          Issue Details
        </CardTitle>
      </CardHeader>
      <ScrollArea className="h-[calc(100%-5rem)] px-4">
        <div className="space-y-4 pb-6">
          {/* Resolution Information */}
          {issue.resolution_notes && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Settings className="h-4 w-4" />
                Resolution Notes
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground break-words">
                  {issue.resolution_notes}
                </p>
                {issue.resolution_date && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Resolved on {format(new Date(issue.resolution_date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Database className="h-4 w-4" />
              Technical Details
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <Badge variant="outline" className="text-xs">
                    {issue.type}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Impact</p>
                  <Badge variant="outline" className="text-xs">
                    {issue.impact_level || 'Not specified'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Lighting Details (if applicable) */}
          {issue.lighting_details && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lightbulb className="h-4 w-4" />
                Lighting Information
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  Status: {issue.lighting_details.fixture_status}
                </p>
                {issue.lighting_details.detected_issues && issue.lighting_details.detected_issues.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Detected Issues:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(issue.lighting_details.detected_issues).map(([key, value]) => (
                        value && (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key.replace(/_/g, ' ')}
                          </Badge>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Photos Section */}
          {issue.photos && issue.photos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Camera className="h-4 w-4" />
                Photos
              </div>
              <IssuePhotos photos={issue.photos} />
            </div>
          )}

          {/* History Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <History className="h-4 w-4" />
              History
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                Created on {format(new Date(issue.created_at), 'MMM d, yyyy')}
              </p>
              {issue.last_status_change && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last status change: {format(new Date(issue.last_status_change), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}
