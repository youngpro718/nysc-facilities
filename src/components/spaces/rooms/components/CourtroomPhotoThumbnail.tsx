
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Image } from "lucide-react";
import { CourtroomPhotos } from '../types/RoomTypes';
import { cn } from "@/lib/utils";

interface CourtroomPhotoThumbnailProps {
  photos: CourtroomPhotos | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Helper to get first photo from array or handle legacy string format
function getFirstPhoto(photos: string[] | string | null | undefined): string | null {
  if (!photos) return null;
  if (Array.isArray(photos)) return photos[0] || null;
  return photos; // Legacy string format
}

function getPhotoCount(photos: string[] | string | null | undefined): number {
  if (!photos) return 0;
  if (Array.isArray(photos)) return photos.length;
  return 1; // Legacy string format
}

export function CourtroomPhotoThumbnail({ 
  photos, 
  size = 'md',
  className 
}: CourtroomPhotoThumbnailProps) {
  // If no photos object or all photos are null/empty, return nothing
  const judgeViewFirst = getFirstPhoto(photos?.judge_view);
  const audienceViewFirst = getFirstPhoto(photos?.audience_view);
  
  if (!photos || (!judgeViewFirst && !audienceViewFirst)) {
    return null;
  }
  
  const judgeViewCount = getPhotoCount(photos?.judge_view);
  const audienceViewCount = getPhotoCount(photos?.audience_view);
  const totalCount = judgeViewCount + audienceViewCount;
  
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
              {judgeViewFirst && (
                <div className={cn("relative rounded-lg overflow-hidden border-2 border-muted shadow-sm hover:shadow-md transition-shadow", sizeClasses[size])}>
                  <img
                    src={judgeViewFirst}
                    alt="Judge View"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs text-center py-1">
                    Judge View {judgeViewCount > 1 && `(${judgeViewCount})`}
                  </div>
                </div>
              )}
              
              {audienceViewFirst && (
                <div className={cn("relative rounded-lg overflow-hidden border-2 border-muted shadow-sm hover:shadow-md transition-shadow", sizeClasses[size])}>
                  <img
                    src={audienceViewFirst}
                    alt="Audience View"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs text-center py-1">
                    Audience View {audienceViewCount > 1 && `(${audienceViewCount})`}
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground mt-2 flex items-center">
              <Image className="h-3 w-3 mr-1" />
              {totalCount} photo{totalCount !== 1 ? 's' : ''} available
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
