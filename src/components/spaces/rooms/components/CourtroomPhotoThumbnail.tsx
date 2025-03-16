
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Image } from "lucide-react";

interface CourtroomPhotoThumbnailProps {
  photos: {
    judge_view?: string | null;
    audience_view?: string | null;
  } | null;
}

export function CourtroomPhotoThumbnail({ photos }: CourtroomPhotoThumbnailProps) {
  if (!photos || (!photos.judge_view && !photos.audience_view)) {
    return null;
  }
  
  // Select the first available photo
  const photoUrl = photos.judge_view || photos.audience_view;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center mt-2">
            <div className="relative h-12 w-16 rounded overflow-hidden border mr-2">
              <img
                src={photoUrl || ''}
                alt="Courtroom View"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs text-muted-foreground flex items-center">
              <Image className="h-3 w-3 mr-1" />
              Courtroom Photos
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Click "View Courtroom Photos" for details</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
