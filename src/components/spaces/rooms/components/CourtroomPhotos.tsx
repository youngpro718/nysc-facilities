
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Eye, Users, Trash2 } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { type CourtroomPhotos as CourtroomPhotosType, Room } from "../../types/RoomTypes";
import { CourtroomPhotoThumbnail } from "./CourtroomPhotoThumbnail";

interface CourtroomPhotosProps {
  room: Room;
  onUpdate: (photos: CourtroomPhotosType) => void;
}

export function CourtroomPhotos({ room, onUpdate }: CourtroomPhotosProps) {
  const [photos, setPhotos] = React.useState<CourtroomPhotosType>({
    judge_view: room.courtroom_photos?.judge_view || null,
    audience_view: room.courtroom_photos?.audience_view || null,
  });

  const handlePhotoChange = (type: keyof CourtroomPhotosType, newPhoto: string | null) => {
    const updatedPhotos = { ...photos, [type]: newPhoto };
    setPhotos(updatedPhotos);
    onUpdate(updatedPhotos);
  };

  const handleRemovePhoto = (type: keyof CourtroomPhotosType) => {
    handlePhotoChange(type, null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Courtroom Photos</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Judge View */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Judge View</h4>
            </div>
            {photos.judge_view ? (
              <CourtroomPhotoThumbnail
                photos={photos}
                type="judge_view"
              />
            ) : (
              <div className="border rounded-md p-4 bg-muted/50 flex items-center justify-center h-32">
                No photo available
              </div>
            )}
          </div>

          {/* Audience View */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Audience View</h4>
            </div>
            {photos.audience_view ? (
              <CourtroomPhotoThumbnail
                photos={photos}
                type="audience_view"
              />
            ) : (
              <div className="border rounded-md p-4 bg-muted/50 flex items-center justify-center h-32">
                No photo available
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
