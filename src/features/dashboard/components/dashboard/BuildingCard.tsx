import type React from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Camera,
  DoorClosed,
  Layers,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  priority?: string;
  issue_type?: string;
  rooms?: {
    room_number?: string;
    name?: string;
  } | null;
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
  fallbackImage: string;
  floorCount: number;
  roomCount: number;
  workingFixtures: number;
  totalFixtures: number;
  buildingIssues: IssueLike[];
  latestPhotoIssue?: IssueLike;
  buildingActivities: ActivityLike[];
  _onMarkAsSeen: (issueId: string) => void;
}

export const BuildingCard = ({
  building,
  buildingImage,
  fallbackImage,
  floorCount,
  roomCount,
  workingFixtures,
  totalFixtures,
  buildingIssues,
  latestPhotoIssue,
}: BuildingCardProps) => {
  const navigate = useNavigate();
  const isOperational = building?.status === "active";
  const healthPct = totalFixtures > 0
    ? Math.round((workingFixtures / totalFixtures) * 100)
    : 100;
  const activeIssues = buildingIssues.length;
  const hasLiveIssuePhoto = Boolean(latestPhotoIssue?.photos?.[0]);
  const roomLabel =
    latestPhotoIssue?.rooms?.room_number ||
    latestPhotoIssue?.rooms?.name;

  const openBuilding = () => {
    if (building?.id) navigate(`/spaces?building=${building.id}`);
  };

  const openIssues = () => {
    if (building?.id) {
      navigate(`/operations?tab=issues&building=${building.id}&filter=active`);
    }
  };

  return (
    <article className="overflow-hidden rounded-md border border-border bg-card">
      <header className="flex min-h-[72px] items-start justify-between gap-4 border-b border-border px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight">
            {building?.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {building?.address}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isOperational ? "bg-status-operational" : "bg-status-critical",
            )}
          />
          <span className="font-medium text-muted-foreground">
            {isOperational ? "Operational" : "Maintenance"}
          </span>
        </div>
      </header>

      <button
        type="button"
        onClick={hasLiveIssuePhoto ? openIssues : openBuilding}
        className="group relative block h-[230px] w-full overflow-hidden bg-muted text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:h-[260px]"
        aria-label={
          hasLiveIssuePhoto
            ? `View active issues for ${building?.name}`
            : `View ${building?.name}`
        }
      >
        <img
          src={buildingImage}
          alt={
            hasLiveIssuePhoto
              ? `Latest reported issue at ${building?.name}`
              : building?.name
          }
          // Issue photos are large user uploads (often >1 MB); lazy-loading the
          // above-the-fold hero made the card look blank while it streamed in.
          loading="eager"
          decoding="async"
          onError={(event) => {
            if (event.currentTarget.src !== fallbackImage) {
              event.currentTarget.src = fallbackImage;
            }
          }}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090909]/95 via-[#090909]/10 to-[#090909]/20" />

        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-sm border border-white/20 bg-[#090909]/80 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
          {hasLiveIssuePhoto ? (
            <>
              <Camera className="h-3.5 w-3.5" />
              Latest issue photo
            </>
          ) : (
            <>
              <Activity className="h-3.5 w-3.5" />
              Building overview
            </>
          )}
        </div>

        <div className="absolute right-4 top-4 rounded-sm border border-white/20 bg-[#090909]/80 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
          {activeIssues > 0
            ? `${activeIssues} active ${activeIssues === 1 ? "issue" : "issues"}`
            : "No active photo reports"}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-4 pb-4 pt-12 sm:px-5">
          {hasLiveIssuePhoto && latestPhotoIssue ? (
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-white/65">
                {latestPhotoIssue.issue_type || latestPhotoIssue.priority || "Facility issue"}
              </p>
              <p className="mt-1 truncate text-base font-semibold text-white">
                {latestPhotoIssue.title}
              </p>
              <p className="mt-1 text-xs text-white/70">
                {roomLabel ? `Room ${roomLabel} · ` : ""}
                Reported{" "}
                {formatDistanceToNow(new Date(latestPhotoIssue.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-base font-semibold text-white">
                No unresolved issue photo
              </p>
              <p className="mt-1 text-xs text-white/70">
                Showing the standard courthouse image
              </p>
            </div>
          )}
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-white">
            View <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </button>

      <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
        <StatCell
          icon={Layers}
          value={floorCount}
          label="Floors"
          ariaLabel={`View floors for ${building?.name}`}
          onClick={(event) => {
            event.stopPropagation();
            if (building?.id) {
              navigate(`/spaces?building=${building.id}&pick=floor`);
            }
          }}
        />
        <StatCell
          icon={DoorClosed}
          value={roomCount}
          label="Rooms"
          ariaLabel={`View rooms in ${building?.name}`}
          onClick={(event) => {
            event.stopPropagation();
            openBuilding();
          }}
        />
        <StatCell
          icon={Activity}
          value={totalFixtures > 0 ? `${healthPct}%` : "—"}
          label={
            totalFixtures > 0
              ? `Lighting · ${totalFixtures} tracked`
              : "No fixtures tracked"
          }
          ariaLabel={`View lighting health for ${building?.name}`}
          onClick={(event) => {
            event.stopPropagation();
            if (building?.id) {
              navigate(`/operations?tab=lighting&building=${building.id}`);
            }
          }}
          valueClassName={cn(
            totalFixtures === 0
              ? "text-muted-foreground"
              : healthPct >= 90
                ? "text-status-operational"
                : healthPct >= 70
                  ? "text-status-warning"
                  : "text-status-critical",
          )}
        />
      </div>

      {activeIssues > 0 && (
        <button
          type="button"
          className="flex w-full items-center justify-between border-t border-border bg-surface-warning/45 px-4 py-2.5 text-left transition-colors hover:bg-surface-warning/70 sm:px-5"
          onClick={openIssues}
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-status-warning" />
            Review active building issues
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </article>
  );
};

function StatCell({
  icon: Icon,
  value,
  label,
  valueClassName,
  onClick,
  ariaLabel,
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
  valueClassName?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "flex min-h-[72px] flex-col items-start justify-center gap-0.5 px-4 py-3 text-left transition-colors hover:bg-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        !onClick && "cursor-default",
      )}
    >
      <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className={cn("text-lg font-semibold tabular-nums", valueClassName)}>
        {value}
      </span>
    </button>
  );
}
