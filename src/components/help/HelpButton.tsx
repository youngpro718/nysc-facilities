import { HelpCircle, BookOpen, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTour } from './TourProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Floating help button that appears in the bottom-right corner.
 * Provides quick access to:
 * - Page-specific interactive tour
 * - Full Help Center
 */
export function HelpButton() {
  const navigate = useNavigate();
  const { startTour, hasTour, currentTourTitle, isRunning } = useTour();

  if (isRunning) return null;

  return (
    <div className="fixed bottom-[10.5rem] md:bottom-6 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className={cn(
              'h-12 w-12 rounded-full shadow-lg border-2',
              'bg-card hover:bg-primary hover:text-primary-foreground',
              'transition-all duration-200 hover:scale-110',
              hasTour && 'border-primary/50'
            )}
            aria-label="Help & Guides"
          >
            <HelpCircle className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56 z-[60]">
          {hasTour && (
            <>
              <DropdownMenuItem
                onClick={startTour}
                className="cursor-pointer gap-2 py-3"
              >
                <Play className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium text-sm">Tour This Page</div>
                  <div className="text-xs text-muted-foreground">{currentTourTitle}</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            onClick={() => navigate('/help')}
            className="cursor-pointer gap-2 py-3"
          >
            <BookOpen className="h-4 w-4 text-primary" />
            <div>
              <div className="font-medium text-sm">Help Center</div>
              <div className="text-xs text-muted-foreground">All guides & tours</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
