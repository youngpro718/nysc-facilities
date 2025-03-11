
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface CourtroomPhotosProps {
  photos: {
    judge_view?: string | null;
    audience_view?: string | null;
  };
}

export function CourtroomPhotos({ photos }: CourtroomPhotosProps) {
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [viewType, setViewType] = useState<string>("");
  
  const hasPhotos = photos?.judge_view || photos?.audience_view;
  
  if (!hasPhotos) {
    return <div className="text-sm text-muted-foreground">No photos available</div>;
  }
  
  const openPhotoDialog = (photoUrl: string | null | undefined, type: string) => {
    if (photoUrl) {
      setViewingPhoto(photoUrl);
      setViewType(type);
    }
  };
  
  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {photos.judge_view && (
          <div 
            className="relative h-20 w-32 rounded border overflow-hidden cursor-pointer" 
            onClick={() => openPhotoDialog(photos.judge_view, "Judge View")}
          >
            <img
              src={photos.judge_view}
              alt="Judge View"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-20 hover:bg-opacity-30 transition-all flex items-center justify-center">
              <span className="text-white text-xs font-medium px-2 py-1 bg-black bg-opacity-50 rounded">Judge View</span>
            </div>
          </div>
        )}
        
        {photos.audience_view && (
          <div 
            className="relative h-20 w-32 rounded border overflow-hidden cursor-pointer" 
            onClick={() => openPhotoDialog(photos.audience_view, "Audience View")}
          >
            <img
              src={photos.audience_view}
              alt="Audience View"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-20 hover:bg-opacity-30 transition-all flex items-center justify-center">
              <span className="text-white text-xs font-medium px-2 py-1 bg-black bg-opacity-50 rounded">Audience View</span>
            </div>
          </div>
        )}
      </div>
      
      <Dialog open={!!viewingPhoto} onOpenChange={(open) => !open && setViewingPhoto(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewType}</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="absolute right-4 top-4">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          {viewingPhoto && (
            <div className="mt-2 w-full h-96 relative">
              <img
                src={viewingPhoto}
                alt={viewType}
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
