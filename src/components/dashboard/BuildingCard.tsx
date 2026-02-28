
import { useNavigate } from "react-router-dom";
import { Building2, Layers, DoorClosed, Activity, AlertTriangle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BuildingCardProps {
  building: any;
  buildingImage: string;
  floorCount: number;
  roomCount: number;
  workingFixtures: number;
  totalFixtures: number;
  buildingIssues: any[];
  buildingActivities: any[];
  onMarkAsSeen: (issueId: string) => void;
}

export const BuildingCard = ({
  building,
  floorCount,
  roomCount,
  workingFixtures,
  totalFixtures,
  buildingIssues,
}: BuildingCardProps) => {
  const navigate = useNavigate();
  const isOperational = building?.status === "active";
  const healthPct = totalFixtures > 0 ? Math.round((workingFixtures / totalFixtures) * 100) : 100;
  const activeIssues = buildingIssues.length;

  const handleClick = () => {
    if (building?.id) navigate(`/spaces?building=${building.id}`);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden cursor-pointer",
        "transition-all duration-150 ease-in-out",
        "hover:bg-card-hover hover:-translate-y-px hover:border-border/80",
        "active:translate-y-0"
      )}
      onClick={handleClick}
    >
      {/* Gradient header with status badge */}
      <div
        className={cn(
          "relative h-[140px] sm:h-[160px] flex items-end p-5",
          isOperational
            ? "bg-gradient-to-br from-status-operational/20 via-status-operational/5 to-transparent"
            : "bg-gradient-to-br from-status-warning/20 via-status-warning/5 to-transparent"
        )}
      >
        <Building2 className="absolute top-5 right-5 h-16 w-16 text-foreground/5" />
        <Badge
          variant={isOperational ? "default" : "destructive"}
          className="absolute top-4 right-4 text-xs"
        >
          {isOperational ? "Operational" : "Maintenance"}
        </Badge>
        <div>
          <h3 className="text-lg font-semibold leading-tight text-foreground">
            {building?.name}
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">{building?.address}</p>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
        <StatCell icon={Layers} value={floorCount} label="Floors" />
        <StatCell icon={DoorClosed} value={roomCount} label="Rooms" />
        <StatCell
          icon={Activity}
          value={`${healthPct}%`}
          label="Health"
          valueClassName={cn(
            healthPct >= 90 ? "text-status-operational" :
            healthPct >= 70 ? "text-status-warning" :
            "text-status-critical"
          )}
        />
      </div>

      {/* Issues banner — only when issues exist */}
      {activeIssues > 0 && (
        <div
          className="flex items-center justify-between px-5 py-3 border-t border-border bg-status-critical/[0.06] cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (building?.id) navigate(`/operations?building=${building.id}&filter=active`);
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-status-warning" />
            <span className="text-sm text-foreground font-medium">
              {activeIssues} Active Issue{activeIssues !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-text-secondary hover:text-foreground transition-colors">
            View <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      )}
    </div>
  );
};

function StatCell({
  icon: Icon,
  value,
  label,
  valueClassName,
}: {
  icon: any;
  value: string | number;
  label: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col items-center py-3 gap-0.5">
      <Icon className="h-3.5 w-3.5 text-text-secondary mb-1" />
      <span className={cn("text-base font-bold", valueClassName)}>{value}</span>
      <span className="text-[11px] text-text-secondary">{label}</span>
    </div>
  );
}
