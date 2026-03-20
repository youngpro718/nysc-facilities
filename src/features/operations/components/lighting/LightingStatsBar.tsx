import { StatusCard } from '@/components/ui/StatusCard';
import { Lightbulb, Zap, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LightingStatsBarProps {
  stats: {
    fixturesOut: number;
    ballastIssues: number;
    needsElectrician: number;
    emergencyNonFunctional: number;
  };
  isLoading: boolean;
}

export function LightingStatsBar({ stats, isLoading }: LightingStatsBarProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-[110px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatusCard
        statusVariant={stats.fixturesOut > 0 ? 'warning' : 'operational'}
        title="Fixtures Out"
        value={stats.fixturesOut}
        icon={Lightbulb}
      />
      <StatusCard
        statusVariant={stats.ballastIssues > 0 ? 'warning' : 'operational'}
        title="Ballast Issues"
        value={stats.ballastIssues}
        icon={Zap}
      />
      <StatusCard
        statusVariant={stats.needsElectrician > 0 ? 'critical' : 'operational'}
        title="Needs Electrician"
        value={stats.needsElectrician}
        icon={AlertTriangle}
      />
      <StatusCard
        statusVariant={stats.emergencyNonFunctional > 0 ? 'critical' : 'operational'}
        title="Emergency Non-Functional"
        value={stats.emergencyNonFunctional}
        icon={ShieldAlert}
      />
    </div>
  );
}
