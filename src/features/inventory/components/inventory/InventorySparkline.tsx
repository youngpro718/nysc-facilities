/**
 * Mini sparkline chart showing inventory quantity trends
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { QUERY_CONFIG } from '@/config';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  itemId: string;
  className?: string;
  showTrendIcon?: boolean;
  height?: number;
}

interface TrendData {
  date: string;
  quantity: number;
}

export function InventorySparkline({ 
  itemId, 
  className,
  showTrendIcon = true,
  height = 32,
}: SparklineProps) {
  const { data: trendData, isLoading } = useQuery({
    queryKey: ['inventory-trend', itemId],
    queryFn: async (): Promise<TrendData[]> => {
      // Get transactions for this item over the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('inventory_item_transactions')
        .select('created_at, new_quantity')
        .eq('item_id', itemId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        return [];
      }

      // Group by day and take latest quantity per day
      const byDay = new Map<string, number>();
      data.forEach(t => {
        const day = new Date(t.created_at).toISOString().split('T')[0];
        byDay.set(day, t.new_quantity);
      });

      return Array.from(byDay.entries()).map(([date, quantity]) => ({
        date,
        quantity,
      }));
    },
    staleTime: QUERY_CONFIG.stale.medium, // 5 minutes
    gcTime: QUERY_CONFIG.gc.long,
    refetchOnWindowFocus: false,
  });

  if (isLoading || !trendData || trendData.length < 2) {
    return showTrendIcon ? (
      <Minus className="h-4 w-4 text-muted-foreground" />
    ) : null;
  }

  // Calculate trend direction
  const firstValue = trendData[0]?.quantity || 0;
  const lastValue = trendData[trendData.length - 1]?.quantity || 0;
  const trend = lastValue - firstValue;
  const isUp = trend > 0;
  const isDown = trend < 0;

  // Color based on trend (green = up/good, red = down/bad for inventory)
  const strokeColor = isUp 
    ? 'hsl(var(--chart-2))' // green-ish
    : isDown 
      ? 'hsl(var(--destructive))' 
      : 'hsl(var(--muted-foreground))';

  const fillColor = isUp
    ? 'hsl(var(--chart-2) / 0.2)'
    : isDown
      ? 'hsl(var(--destructive) / 0.2)'
      : 'hsl(var(--muted) / 0.3)';

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {showTrendIcon && (
        <div className={cn(
          'shrink-0',
          isUp && 'text-chart-2',
          isDown && 'text-destructive',
          !isUp && !isDown && 'text-muted-foreground'
        )}>
          {isUp ? (
            <TrendingUp className="h-4 w-4" />
          ) : isDown ? (
            <TrendingDown className="h-4 w-4" />
          ) : (
            <Minus className="h-4 w-4" />
          )}
        </div>
      )}
      <div style={{ width: 60, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <defs>
              <linearGradient id={`gradient-${itemId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.4} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px',
                padding: '4px 8px',
              }}
              formatter={(value: number) => [`${value} units`, 'Qty']}
              labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
            />
            <Area
              type="monotone"
              dataKey="quantity"
              stroke={strokeColor}
              strokeWidth={1.5}
              fill={`url(#gradient-${itemId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
