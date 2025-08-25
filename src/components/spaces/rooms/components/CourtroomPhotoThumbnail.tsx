
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Image } from "lucide-react";
import { CourtroomPhotos } from '../types/RoomTypes';
import { cn } from "@/lib/utils";

interface CourtroomPhotoThumbnailProps {
  photos: CourtroomPhotos | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CourtroomPhotoThumbnail({ 
  photos, 
  size = 'md',
  className 
}: CourtroomPhotoThumbnailProps) {
  // If no photos object or all photos are null/empty, return nothing
  if (!photos || (!photos.judge_view && !photos.audience_view)) {
    return null;
  }
  
  // Select both views if they exist
  const hasJudgeView = !!photos.judge_view;
  const hasAudienceView = !!photos.audience_view;
  
  // Determine size classes - enlarged for better real estate usage
  const sizeClasses = {
    sm: 'h-12 w-18',
    md: 'h-16 w-24',
    lg: 'h-24 w-36'
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("mt-2", className)}>
            <div className="flex gap-3 items-start">
              {photos.judge_view && (
                <div className={cn("relative rounded-lg overflow-hidden border-2 border-muted shadow-sm hover:shadow-md transition-shadow", sizeClasses[size])}>
                  <img
                    src={photos.judge_view}
                    alt="Judge View"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs text-center py-1">
                    Judge View
                  </div>
                </div>
              )}
              
              {photos.audience_view && (
                <div className={cn("relative rounded-lg overflow-hidden border-2 border-muted shadow-sm hover:shadow-md transition-shadow", sizeClasses[size])}>
                  <img
                    src={photos.audience_view}
                    alt="Audience View"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs text-center py-1">
                    Audience View
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground mt-2 flex items-center">
              <Image className="h-3 w-3 mr-1" />
              {hasJudgeView && hasAudienceView 
                ? 'Both courtroom views available' 
                : hasJudgeView 
                  ? 'Judge view available' 
                  : 'Audience view available'}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="text-xs">Click "View Courtroom Photos" for details</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
