import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Check, RefreshCcw } from 'lucide-react';
import { useToast } from '@shared/hooks/use-toast';
import {
  getMySupplyOrderCode,
  regenerateMySupplyOrderCode,
} from '@features/supply/services/supplyOrderCode';

const QUERY_KEY = ['my-supply-order-code'] as const;

/**
 * "Your supply order code" card — auto-generates on first load, shown in
 * profile so the user always knows where to find it. Used by the supply cart
 * to authorize larger orders without supervisor approval.
 */
export function MySupplyOrderCode() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);

  const { data: code, isLoading, error } = useQuery<string>({
    queryKey: QUERY_KEY,
    queryFn: getMySupplyOrderCode,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const rotateMutation = useMutation({
    mutationFn: regenerateMySupplyOrderCode,
    onSuccess: (next) => {
      qc.setQueryData(QUERY_KEY, next);
      toast({ title: 'New code generated', description: 'Your previous code no longer works.' });
    },
    onError: (err: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Could not generate a new code',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
    onSettled: () => setRotating(false),
  });

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard might be blocked; silently no-op.
    }
  };

  const handleRotate = () => {
    if (!confirm('Generate a new code? Your current one will stop working immediately.')) return;
    setRotating(true);
    rotateMutation.mutate();
  };

  return (
    <Card className="border-0 sm:border sm:shadow-sm">
      <div className="p-4 sm:p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Your supply order code
          </h2>
          <p className="text-sm text-muted-foreground">
            Use this code when ordering a larger-than-usual quantity of any supply item.
            Entering it counts as your own authorization — no supervisor wait.
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-16 w-40" />
        ) : error ? (
          <p className="text-sm text-destructive">
            Could not load your code. Try refreshing the page.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="font-mono text-3xl sm:text-4xl tracking-[0.4em] tabular-nums px-5 py-3 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors"
              aria-label={`Copy supply order code ${code}`}
            >
              {code}
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotate}
              disabled={rotating}
              className="gap-1.5"
            >
              <RefreshCcw className={`h-4 w-4 ${rotating ? 'animate-spin' : ''}`} />
              Generate new
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Keep this code private. If you think someone else has seen it, generate a new one.
        </p>
      </div>
    </Card>
  );
}
