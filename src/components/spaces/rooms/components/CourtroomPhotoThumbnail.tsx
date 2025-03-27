
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
  
  // Determine size classes
  const sizeClasses = {
    sm: 'h-10 w-14',
    md: 'h-12 w-16',
    lg: 'h-16 w-24'
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center mt-2", className)}>
            {photos.judge_view && (
              <div className={cn("relative rounded overflow-hidden border mr-2", sizeClasses[size])}>
                <img
                  src={photos.judge_view}
                  alt="Judge View"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center">
                  Judge
                </div>
              </div>
            )}
            
            {photos.audience_view && (
              <div className={cn("relative rounded overflow-hidden border mr-2", sizeClasses[size])}>
                <img
                  src={photos.audience_view}
                  alt="Audience View"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center">
                  Audience
                </div>
              </div>
            )}
            
            <span className="text-xs text-muted-foreground flex items-center">
              <Image className="h-3 w-3 mr-1" />
              {hasJudgeView && hasAudienceView 
                ? 'Both views' 
                : hasJudgeView 
                  ? 'Judge view' 
                  : 'Audience view'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="text-xs">Click "View Courtroom Photos" for details</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
