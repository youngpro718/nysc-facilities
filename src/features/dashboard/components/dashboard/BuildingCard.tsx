
import { useNavigate } from "react-router-dom";
import { Layers, DoorClosed, Activity, AlertTriangle, ArrowRight, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { BuildingWithLighting } from "@/utils/dashboardUtils";

interface IssueLike {
  id: string;
  title: string;
  description: string;
  building_id: string;
  photos?: string[];
  created_at: string;
  seen: boolean;
  status: string;
}

interface ActivityLike {
  id: string;
  action: string;
  performed_by?: string;
  created_at: string;
  metadata?: {
    building_id: string;
    [key: string]: unknown;
  };
}

interface BuildingCardProps {
  building: BuildingWithLighting;
  buildingImage: string;
  floorCount: number;
  roomCount: number;
  workingFixtures: number;
  totalFixtures: number;
  buildingIssues: IssueLike[];
  buildingActivities: ActivityLike[];
  _onMarkAsSeen: (issueId: string) => void;
  index?: number;
}

export const BuildingCard = ({
  building,
  buildingImage,
  floorCount,
  roomCount,
  workingFixtures,
  totalFixtures,
  buildingIssues,
  _onMarkAsSeen,
  index = 0,
}: BuildingCardProps) => {
  const navigate = useNavigate();
  const isOperational = building?.status === "active";
  const healthPct = totalFixtures > 0 ? Math.round((workingFixtures / totalFixtures) * 100) : 100;
  const activeIssues = buildingIssues.length;

  const handleClick = () => {
    if (building?.id) navigate(`/spaces?building=${building.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.215, 0.61, 0.355, 1] }}
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden cursor-pointer",
        "transition-all duration-150 ease-in-out",
        "hover:bg-card-hover hover:-translate-y-px hover:border-border/80",
        "active:translate-y-0"
      )}
      onClick={handleClick}
    >
      {/* Photo header with status badge */}
      <div className="relative h-[180px] overflow-hidden">
        <img
          src={buildingImage}
          alt={building?.name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Badge
          variant={isOperational ? "default" : "destructive"}
          className="absolute top-4 right-4 text-xs"
        >
          {isOperational ? "Operational" : "Maintenance"}
        </Badge>
        <div className="absolute bottom-4 left-5">
          <h3 className="text-lg font-semibold leading-tight text-white">
            {building?.name}
          </h3>
          <p className="text-xs text-white/70 mt-0.5">{building?.address}</p>
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
    </motion.div>
  );
};

function StatCell({
  icon: Icon,
  value,
  label,
  valueClassName,
}: {
  icon: LucideIcon;
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
