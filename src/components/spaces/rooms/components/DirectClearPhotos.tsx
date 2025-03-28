import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useRouter } from 'next/navigation';

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
      
      // Get the current room data to find the photo URLs
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('courtroom_photos')
        .eq('id', roomId)
        .single();
        
      if (roomError) {
        console.error('Error fetching room data:', roomError);
        toast.error('Failed to fetch room data');
        setIsClearing(false);
        return;
      }
      
      console.log('Current room data:', room);
      
      // Update the database to null out the photo references
      const { error: updateError } = await supabase
        .from('rooms')
        .update({
          courtroom_photos: { judge_view: null, audience_view: null }
        })
        .eq('id', roomId);
        
      if (updateError) {
        console.error('Error updating room data:', updateError);
        toast.error('Failed to update room data');
        setIsClearing(false);
        return;
      }
      
      toast.success('Photos cleared successfully');
      
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
