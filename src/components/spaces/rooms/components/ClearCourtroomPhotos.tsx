import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useRouter } from 'next/navigation';

interface ClearCourtroomPhotosProps {
  roomId: string;
}

export function ClearCourtroomPhotos({ roomId }: ClearCourtroomPhotosProps) {
  const [isClearing, setIsClearing] = useState(false);
  const router = useRouter();

  const clearPhotos = async () => {
    if (!confirm('Are you sure you want to clear all courtroom photos? This cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    
    try {
      console.log('Clearing courtroom photos for room:', roomId);
      
      // Direct update approach
      const { data, error } = await supabase
        .from('rooms')
        .update({ 
          courtroom_photos: { judge_view: null, audience_view: null } 
        })
        .eq('id', roomId)
        .select();
        
      if (error) {
        throw error;
      }
      
      console.log('Update result:', data);
      toast.success('Photos cleared successfully');
      
      // Force refresh the page to show changes
      router.refresh();
      
      // Also do a hard refresh after a short delay to ensure data is reloaded
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
