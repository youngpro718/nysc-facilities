import React from 'react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { CourtroomPhotos } from "../../types/RoomTypes";

interface CourtroomPhotoThumbnailProps {
  photos: CourtroomPhotos | null | undefined;
  type: 'judge_view' | 'audience_view';
}

export function CourtroomPhotoThumbnail({ photos, type }: CourtroomPhotoThumbnailProps) {
  const imageUrl = photos?.[type] || '';
  const title = type === 'judge_view' ? 'Judge View' : 'Audience View';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="relative rounded-md overflow-hidden w-32 h-24 cursor-pointer">
          <AspectRatio ratio={4 / 3}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="object-cover aspect-video"
              />
            ) : (
              <div className="bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No Photo
              </div>
            )}
          </AspectRatio>
          <div className="absolute inset-0 bg-black opacity-0 hover:opacity-60 transition-opacity flex items-center justify-center text-white font-semibold text-sm">
            View {title}
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <div className="rounded-md overflow-hidden">
          <AspectRatio ratio={16 / 9}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="object-cover aspect-video"
              />
            ) : (
              <div className="bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No Photo
              </div>
            )}
          </AspectRatio>
        </div>
        <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          {title}
        </div>
      </DialogContent>
    </Dialog>
  );
}
