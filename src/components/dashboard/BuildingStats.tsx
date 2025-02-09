import { Building2, ClipboardList, LightbulbIcon, Layers, DoorClosed, Gauge } from "lucide-react";

interface BuildingStatsProps {
  floorCount: number;
  roomCount: number;
  scheduledTasks: number;
  workingFixtures: number;
  totalFixtures: number;
}

export const BuildingStats = ({
  floorCount,
  roomCount,
  scheduledTasks,
  workingFixtures,
  totalFixtures,
}: BuildingStatsProps) => (
  <div className="grid gap-3 md:grid-cols-3">
    <div className="space-y-1.5 rounded-lg border bg-card p-3 transition-all duration-200 hover:bg-accent hover:shadow-lg">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Building2 className="h-3.5 w-3.5 text-blue-500" />
        <span className="text-xs font-medium">Building Overview</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold">{floorCount}</span>
            <span className="text-xs text-muted-foreground">Floors</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <Layers className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-lg font-semibold">{roomCount}</span>
            <span className="text-xs text-muted-foreground">Rooms</span>
          </div>
        </div>
        <DoorClosed className="h-7 w-7 text-muted-foreground/20" />
      </div>
    </div>

    <div className="space-y-1.5 rounded-lg border bg-card p-3 transition-all duration-200 hover:bg-accent hover:shadow-lg">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <ClipboardList className="h-3.5 w-3.5 text-yellow-500" />
        <span className="text-xs font-medium">Scheduled Tasks</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold">{scheduledTasks}</span>
          <span className="text-xs text-muted-foreground">Active</span>
        </div>
        <Gauge className="h-7 w-7 text-muted-foreground/20" />
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {scheduledTasks > 0 ? 
          `${scheduledTasks} task${scheduledTasks === 1 ? '' : 's'} require attention` : 
          'No pending tasks'}
      </div>
    </div>

    <div className="space-y-1.5 rounded-lg border bg-card p-3 transition-all duration-200 hover:bg-accent hover:shadow-lg">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <LightbulbIcon className="h-3.5 w-3.5 text-green-500" />
        <span className="text-xs font-medium">Lighting Status</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-xl font-bold">{workingFixtures}</span>
        <span className="text-xs text-muted-foreground">Working Fixtures</span>
      </div>
      <div className="space-y-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{
              width: `${totalFixtures ? (workingFixtures / totalFixtures) * 100 : 0}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Total: {totalFixtures}</span>
          <span className="font-medium text-green-500">
            {Math.round((workingFixtures / totalFixtures) * 100)}% Operational
          </span>
        </div>
      </div>
    </div>
  </div>
);