
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { courtroomPhotoService } from '@/services/courtroom-photos';

interface DirectClearPhotosProps {
  roomId: string;
}

export function DirectClearPhotos({ roomId }: DirectClearPhotosProps) {
  const [isClearing, setIsClearing] = useState(false);
  const router = useRouter();

  const clearPhotos = async () => {
    if (!confirm('Are you sure you want to clear all courtroom photos? This cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    
    try {
      console.log('Directly clearing courtroom photos for room:', roomId);
      
      const result = await courtroomPhotoService.clearPhotos(roomId);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      console.log('Clear photos result:', result);
      
      if (result.errors?.length > 0) {
        // Some operations succeeded but there were also errors
        toast.warning(`Photos cleared with ${result.errors.length} errors. Some files may need manual cleanup.`);
      } else {
        toast.success(`Photos cleared successfully (${result.filesDeleted} files removed)`);
      }
      
      // Force a refresh to show the changes
      router.refresh();
      
      // Also do a hard refresh after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error('Error clearing photos:', error);
      toast.error(`Failed to clear photos: ${error.message || 'Unknown error'}`);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={clearPhotos}
      disabled={isClearing}
    >
      <Trash2 className="h-4 w-4 mr-1" />
      {isClearing ? 'Clearing...' : 'Clear Photos'}
    </Button>
  );
}
