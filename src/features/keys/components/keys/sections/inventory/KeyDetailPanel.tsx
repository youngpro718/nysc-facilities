import { formatDistanceToNow } from "date-fns";
import {
  Package,
  Shield,
  ShieldOff,
  Trash2,
  Users,
  AlertTriangle,
  KeyRound,
  Mail,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KeyData } from "../../types/KeyTypes";
import { KeyStockAdjustment } from "../../inventory/KeyStockAdjustment";
import { useKeyAssignmentsForKey } from "./useKeyAssignmentsForKey";

interface KeyDetailPanelProps {
  selectedKey: KeyData | null;
  onDeleteKey?: (key: KeyData) => void;
  onToggleCaptainOfficeCopy?: (keyId: string, currentStatus: boolean) => void;
}

const TYPE_LABELS: Record<string, string> = {
  physical_key: "Physical Key",
  room_key: "Room Key",
  elevator_pass: "Elevator Pass",
};

const STATUS_PILL: Record<string, string> = {
  available:
    "bg-status-operational/10 text-status-operational border-status-operational/30",
  assigned: "bg-status-warning/10 text-status-warning border-status-warning/30",
  lost: "bg-status-critical/10 text-status-critical border-status-critical/30",
  decommissioned:
    "bg-status-neutral/10 text-status-neutral border-status-neutral/30",
};

export function KeyDetailPanel({
  selectedKey,
  onDeleteKey,
  onToggleCaptainOfficeCopy,
}: KeyDetailPanelProps) {
  const { data: assignments, isLoading: assignmentsLoading } =
    useKeyAssignmentsForKey(selectedKey?.id ?? null);

  if (!selectedKey) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
        <KeyRound className="h-12 w-12 opacity-40 mb-3" />
        <h3 className="text-lg font-medium text-foreground mb-1">
          Select a key
        </h3>
        <p className="text-sm">
          Pick a key from the list to see assignments and manage it.
        </p>
      </div>
    );
  }

  const k = selectedKey;
  const out = k.available_quantity === 0;
  const statusPill = STATUS_PILL[k.status] ?? STATUS_PILL.available;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                  <h2 className="text-lg font-semibold text-foreground truncate">
                    {k.name}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="text-xs">
                    {TYPE_LABELS[k.type] || k.type}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${statusPill}`}
                  >
                    {k.status}
                  </Badge>
                  {k.is_passkey && (
                    <Badge variant="secondary" className="text-xs">
                      Passkey
                    </Badge>
                  )}
                  {out && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-status-critical/10 text-status-critical border-status-critical/30"
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Out of Stock
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <KeyStockAdjustment keyId={k.id} keyName={k.name} />
                {onDeleteKey && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteKey(k)}
                    aria-label="Delete key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Stock stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
              <Stat label="Total" value={k.total_quantity} />
              <Stat
                label="Available"
                value={k.available_quantity}
                tone={out ? "critical" : undefined}
              />
              <Stat label="Assigned" value={k.active_assignments ?? 0} />
            </div>

            {/* Captain's office */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-foreground">
                {k.captain_office_copy ? (
                  <Shield className="h-4 w-4 text-status-operational" />
                ) : (
                  <ShieldOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span>
                  Captain's Office:{" "}
                  <span
                    className={
                      k.captain_office_copy
                        ? "text-status-operational font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {k.captain_office_copy ? "Has copy" : "Missing"}
                  </span>
                </span>
                {k.captain_office_copy && k.captain_office_assigned_date && (
                  <span className="text-xs text-muted-foreground">
                    · since{" "}
                    {new Date(
                      k.captain_office_assigned_date
                    ).toLocaleDateString()}
                  </span>
                )}
              </div>
              {onToggleCaptainOfficeCopy && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onToggleCaptainOfficeCopy(k.id, k.captain_office_copy)
                  }
                >
                  {k.captain_office_copy ? "Mark missing" : "Mark has copy"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active assignments */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Active Assignments
              </h3>
              <Badge variant="secondary" className="text-xs ml-auto">
                {assignments?.length ?? 0}
              </Badge>
            </div>

            {assignmentsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 rounded" />
                <Skeleton className="h-12 rounded" />
              </div>
            ) : !assignments || assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No active assignments.
              </p>
            ) : (
              <ul className="divide-y">
                {assignments.map((a) => {
                  const occ = a.occupant;
                  const displayName =
                    (occ &&
                      [occ.first_name, occ.last_name]
                        .filter(Boolean)
                        .join(" ")) ||
                    a.recipient_name ||
                    "Unknown recipient";
                  const email = occ?.email || a.recipient_email;
                  return (
                    <li
                      key={a.id}
                      className="py-2.5 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {displayName}
                          </span>
                          {a.is_spare && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4"
                            >
                              Spare
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                          {email && (
                            <span className="inline-flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{email}</span>
                            </span>
                          )}
                          {occ?.department && (
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {occ.department}
                            </span>
                          )}
                          <span>
                            since{" "}
                            {formatDistanceToNow(new Date(a.assigned_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "critical";
}) {
  return (
    <div className="text-center">
      <div
        className={`text-xl font-semibold ${
          tone === "critical" ? "text-status-critical" : "text-foreground"
        }`}
      >
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
