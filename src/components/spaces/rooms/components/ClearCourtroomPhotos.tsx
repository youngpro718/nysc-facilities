
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { courtroomPhotoService } from '@/services/courtroom-photos';

interface ClearCourtroomPhotosProps {
  roomId: string;
}

export function ClearCourtroomPhotos({ roomId }: ClearCourtroomPhotosProps) {
  const [isClearing, setIsClearing] = useState(false);

  const clearPhotos = async () => {
    if (!confirm('Are you sure you want to clear all courtroom photos? This cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    
    try {
      console.log('Clearing courtroom photos for room:', roomId);
      
      const result = await courtroomPhotoService.clearPhotos(roomId);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to clear photos');
      }
      
      console.log('Clear photos result:', result);
      
      if (result.errors?.length > 0) {
        // Some operations succeeded but there were also errors
        toast.warning(`Photos cleared with ${result.errors.length} errors. Some files may need manual cleanup.`);
      } else {
        toast.success(`Photos cleared successfully (${result.filesDeleted || 0} files removed)`);
      }
      
      // Force refresh the page to show changes
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

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={clearPhotos}
      disabled={isClearing}
      className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
    >
      <Trash2 className="h-4 w-4 mr-1" />
      {isClearing ? 'Clearing...' : 'Clear All Photos'}
    </Button>
  );
}
