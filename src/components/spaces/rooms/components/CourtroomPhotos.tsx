
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Room } from '../types/RoomTypes';
import { BadgeInfo } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CourtroomPhotosProps {
  room: Room;
}

export function CourtroomPhotos({ room }: CourtroomPhotosProps) {
  const [open, setOpen] = useState(false);
  const [activeView, setActiveView] = useState<'judge' | 'audience'>('judge');
  
  const hasPhotos = room.courtroom_photos &&
    (room.courtroom_photos.judge_view || room.courtroom_photos.audience_view);
  
  if (!hasPhotos || room.room_type !== 'courtroom') return null;
  
  const handleTabChange = (view: 'judge' | 'audience') => {
    setActiveView(view);
  };
  
  const judgeViewUrl = room.courtroom_photos?.judge_view;
  const audienceViewUrl = room.courtroom_photos?.audience_view;
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-1 px-0 flex items-center"
        >
          <BadgeInfo className="h-4 w-4 mr-1" />
          <span>View Courtroom Photos</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Courtroom Photos - {room.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-2">
          <div className="flex space-x-2">
            <Button
              variant={activeView === 'judge' ? "default" : "outline"}
              onClick={() => handleTabChange('judge')}
              disabled={!judgeViewUrl}
              className="flex-1"
            >
              Judge View
            </Button>
            <Button
              variant={activeView === 'audience' ? "default" : "outline"}
              onClick={() => handleTabChange('audience')}
              disabled={!audienceViewUrl}
              className="flex-1"
            >
              Audience View
            </Button>
          </div>
          
          <div className="rounded-md overflow-hidden bg-secondary/50 min-h-[250px] flex items-center justify-center">
            {activeView === 'judge' && judgeViewUrl ? (
              <img 
                src={judgeViewUrl} 
                alt="Judge View" 
                className="w-full h-auto object-contain max-h-[350px]" 
              />
            ) : activeView === 'audience' && audienceViewUrl ? (
              <img 
                src={audienceViewUrl} 
                alt="Audience View" 
                className="w-full h-auto object-contain max-h-[350px]" 
              />
            ) : (
              <div className="text-muted-foreground text-center p-4">
                {activeView === 'judge' ? 'No judge view photo available' : 'No audience view photo available'}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
