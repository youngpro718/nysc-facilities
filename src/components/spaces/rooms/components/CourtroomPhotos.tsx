
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Room } from '../types/RoomTypes';
import { BadgeInfo, Download, Maximize2, Image as ImageIcon, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from "sonner";
import { courtroomPhotoService } from '@/services/courtroom-photos';

interface CourtroomPhotosProps {
  room: Room;
}

export function CourtroomPhotos({ room }: CourtroomPhotosProps) {
  const [open, setOpen] = useState(false);
  const [activeView, setActiveView] = useState<'judge' | 'audience'>('judge');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  // Use the correct property name from the Room type
  const photos = room.courtroom_photos;
  
  // Get photos as arrays (handle both old single-string format and new array format)
  const judgeViewPhotos = photos?.judge_view 
    ? (Array.isArray(photos.judge_view) ? photos.judge_view : [photos.judge_view])
    : [];
  const audienceViewPhotos = photos?.audience_view 
    ? (Array.isArray(photos.audience_view) ? photos.audience_view : [photos.audience_view])
    : [];
  
  // Check if room has courtroom photos
  const hasPhotos = judgeViewPhotos.length > 0 || audienceViewPhotos.length > 0;
  
  // If no photos or not a courtroom, don't render anything
  if (!hasPhotos || room.room_type !== 'courtroom') return null;
  
  const currentPhotos = activeView === 'judge' ? judgeViewPhotos : audienceViewPhotos;
  const currentPhoto = currentPhotos[activePhotoIndex];
  
  const handleTabChange = (view: 'judge' | 'audience') => {
    setActiveView(view);
    setActivePhotoIndex(0); // Reset to first photo when switching views
  };
  
  const handlePrevPhoto = () => {
    setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : currentPhotos.length - 1));
  };
  
  const handleNextPhoto = () => {
    setActivePhotoIndex((prev) => (prev < currentPhotos.length - 1 ? prev + 1 : 0));
  };
  
  // Download the current active photo
  const handleDownload = () => {
    if (!currentPhoto) return;
    
    const link = document.createElement('a');
    link.href = currentPhoto;
    link.download = `courtroom-${room.id}-${activeView}-view-${activePhotoIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Toggle fullscreen mode
  const handleFullscreen = () => {
    setFullscreen(!fullscreen);
  };
  
  // Clear photos directly using the service
  const clearPhotos = async () => {
    if (!confirm('Are you sure you want to clear all courtroom photos? This cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    
    try {
      console.log('Clearing courtroom photos for room:', room.id);
      
      const result = await courtroomPhotoService.clearPhotos(room.id);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to clear photos');
      }
      
      console.log('Clear photos result:', result);
      
      if (result.errors?.length > 0) {
        toast.warning(`Photos cleared with ${result.errors.length} errors. Some files may need manual cleanup.`);
      } else {
        toast.success(`Photos cleared successfully (${result.filesDeleted || 0} files removed)`);
      }
      
      setOpen(false);
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error('Failed to clear photos:', error);
      toast.error(`Failed to clear photos: ${error.message || 'Unknown error'}`);
    } finally {
      setIsClearing(false);
    }
  };
  
  const totalPhotos = judgeViewPhotos.length + audienceViewPhotos.length;
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-1 px-0 flex items-center"
        >
          <BadgeInfo className="h-4 w-4 mr-1" />
          <span>View Courtroom Photos ({totalPhotos})</span>
        </Button>
      </DialogTrigger>
      <DialogContent className={cn(
        "transition-all duration-300 ease-in-out",
        fullscreen ? "max-w-[90vw] h-[90vh]" : "sm:max-w-md"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Courtroom Photos - {room.name}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearPhotos}
                disabled={isClearing}
                className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {isClearing ? 'Clearing...' : 'Clear All'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFullscreen}
                className="h-8 w-8"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className={cn(
          "space-y-4 mt-2",
          fullscreen && "flex flex-col h-[calc(90vh-80px)]"
        )}>
          {/* View Toggle Buttons */}
          <div className="flex space-x-2">
            <Button
              variant={activeView === 'judge' ? "default" : "outline"}
              onClick={() => handleTabChange('judge')}
              disabled={judgeViewPhotos.length === 0}
              className="flex-1"
            >
              Judge View ({judgeViewPhotos.length})
            </Button>
            <Button
              variant={activeView === 'audience' ? "default" : "outline"}
              onClick={() => handleTabChange('audience')}
              disabled={audienceViewPhotos.length === 0}
              className="flex-1"
            >
              Audience View ({audienceViewPhotos.length})
            </Button>
          </div>
          
          {/* Photo Display with Navigation */}
          <div className={cn(
            "rounded-md overflow-hidden bg-secondary/50 relative flex items-center justify-center",
            fullscreen ? "flex-1" : "min-h-[250px]"
          )}>
            {currentPhoto ? (
              <>
                <img 
                  src={currentPhoto} 
                  alt={`${activeView === 'judge' ? 'Judge' : 'Audience'} View ${activePhotoIndex + 1}`}
                  className={cn(
                    "object-contain", 
                    fullscreen ? "max-h-full max-w-full" : "max-h-[350px] w-full"
                  )}
                />
                
                {/* Navigation Arrows - only show if more than one photo */}
                {currentPhotos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePrevPhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleNextPhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
                
                {/* Photo Counter */}
                {currentPhotos.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm">
                    {activePhotoIndex + 1} / {currentPhotos.length}
                  </div>
                )}
              </>
            ) : (
              <div className="text-muted-foreground text-center p-4 flex flex-col items-center">
                <ImageIcon className="h-10 w-10 mb-2 opacity-30" />
                {activeView === 'judge' ? 'No judge view photos available' : 'No audience view photos available'}
              </div>
            )}
          </div>
          
          {/* Thumbnail Strip */}
          {currentPhotos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {currentPhotos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setActivePhotoIndex(index)}
                  className={cn(
                    "flex-shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-all",
                    index === activePhotoIndex 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <img 
                    src={photo} 
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
          
          {currentPhoto && (
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
