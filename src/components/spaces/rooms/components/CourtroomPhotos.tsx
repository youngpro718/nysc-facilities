
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Room } from '../types/RoomTypes';
import { BadgeInfo, Download, Maximize2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CourtroomPhotosProps {
  room: Room;
}

export function CourtroomPhotos({ room }: CourtroomPhotosProps) {
  const [open, setOpen] = useState(false);
  const [activeView, setActiveView] = useState<'judge' | 'audience'>('judge');
  const [fullscreen, setFullscreen] = useState(false);
  
  // Use the correct property name from the Room type
  const photos = room.courtroom_photos;
  
  // Check if room has courtroom photos
  const hasPhotos = photos && (photos.judge_view || photos.audience_view);
  
  // If no photos or not a courtroom, don't render anything
  if (!hasPhotos || room.room_type !== 'courtroom') return null;
  
  const handleTabChange = (view: 'judge' | 'audience') => {
    setActiveView(view);
  };
  
  // Safely access photo URLs
  const judgeViewUrl = photos?.judge_view;
  const audienceViewUrl = photos?.audience_view;
  
  // Determine which image to show as the primary one
  const activeImageUrl = activeView === 'judge' ? judgeViewUrl : audienceViewUrl;
  
  // Download the current active photo
  const handleDownload = () => {
    if (!activeImageUrl) return;
    
    const link = document.createElement('a');
    link.href = activeImageUrl;
    link.download = `courtroom-${room.id}-${activeView}-view.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Toggle fullscreen mode
  const handleFullscreen = () => {
    setFullscreen(!fullscreen);
  };
  
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
      <DialogContent className={cn(
        "transition-all duration-300 ease-in-out",
        fullscreen ? "max-w-[90vw] h-[90vh]" : "sm:max-w-md"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Courtroom Photos - {room.name}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
              className="h-8 w-8"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className={cn(
          "space-y-4 mt-2",
          fullscreen && "flex flex-col h-[calc(90vh-80px)]"
        )}>
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
          
          <div className={cn(
            "rounded-md overflow-hidden bg-secondary/50 relative flex items-center justify-center",
            fullscreen ? "flex-1" : "min-h-[250px]"
          )}>
            {activeView === 'judge' && judgeViewUrl ? (
              <img 
                src={judgeViewUrl} 
                alt="Judge View" 
                className={cn(
                  "object-contain", 
                  fullscreen ? "max-h-full max-w-full" : "max-h-[350px] w-full"
                )}
              />
            ) : activeView === 'audience' && audienceViewUrl ? (
              <img 
                src={audienceViewUrl} 
                alt="Audience View" 
                className={cn(
                  "object-contain", 
                  fullscreen ? "max-h-full max-w-full" : "max-h-[350px] w-full"
                )}
              />
            ) : (
              <div className="text-muted-foreground text-center p-4 flex flex-col items-center">
                <ImageIcon className="h-10 w-10 mb-2 opacity-30" />
                {activeView === 'judge' ? 'No judge view photo available' : 'No audience view photo available'}
              </div>
            )}
          </div>
          
          {activeImageUrl && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
