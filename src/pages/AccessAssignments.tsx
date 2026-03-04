import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { usePersonnelAccess } from "@/hooks/usePersonnelAccess";
import { RoleBasedRoute } from "@/components/layout/RoleBasedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Search, Users, UserCheck, Key, DoorOpen, Building2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PersonnelAccessRecord } from "@/hooks/usePersonnelAccess";
import { StatusCard } from "@/components/ui/StatusCard";
import { PersonDetailSheet } from "@/components/access-assignments/PersonDetailSheet";

// ── Person Card ───────────────────────────────────────────────────────────────

function PersonnelCard({
  person,
  onClick,
}: {
  person: PersonnelAccessRecord;
  onClick?: () => void;
}) {
  const initials =
    person.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";

  return (
    <Card
      className="hover:shadow-md transition-all cursor-pointer hover:border-primary/50 group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
            {person.avatar_url && (
              <AvatarFallback />
            )}
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-medium text-sm truncate">{person.name}</h3>
              <Badge
                variant={person.is_registered_user ? "default" : "secondary"}
                className="text-xs shrink-0"
              >
                {person.is_registered_user ? "User" : "Personnel"}
              </Badge>
            </div>

            {person.title && (
              <p className="text-xs text-muted-foreground truncate">{person.title}</p>
            )}
            {person.department && (
              <p className="text-xs text-muted-foreground truncate">{person.department}</p>
            )}

            <div className="flex items-center gap-3 mt-2">
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  person.room_count > 0 ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <DoorOpen className="h-3 w-3" />
                {person.room_count} room{person.room_count !== 1 ? "s" : ""}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  person.key_count > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                )}
              >
                <Key className="h-3 w-3" />
                {person.key_count} key{person.key_count !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Filter chips ──────────────────────────────────────────────────────────────

type QuickFilter = "all" | "users" | "personnel" | "has_rooms" | "has_keys" | "unassigned";

const QUICK_FILTERS: { id: QuickFilter; label: string; icon?: React.ElementType }[] = [
  { id: "all", label: "All", icon: Users },
  { id: "users", label: "Users", icon: UserCheck },
  { id: "personnel", label: "Personnel", icon: Building2 },
  { id: "has_rooms", label: "Has Rooms", icon: DoorOpen },
  { id: "has_keys", label: "Has Keys", icon: Key },
  { id: "unassigned", label: "Unassigned" },
];

// ── Grid ──────────────────────────────────────────────────────────────────────

function PersonnelGrid({
  personnel,
  isLoading,
  onPersonClick,
}: {
  personnel: PersonnelAccessRecord[];
  isLoading: boolean;
  onPersonClick: (p: PersonnelAccessRecord) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  if (personnel.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-40" />
        <p className="font-medium">No results</p>
        <p className="text-sm mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-tour="personnel-card">
      {personnel.map((person) => (
        <PersonnelCard
          key={person.id}
          person={person}
          onClick={() => onPersonClick(person)}
        />
      ))}
    </div>
  );
}

// ── Department filter helpers ─────────────────────────────────────────────────

function getDepartments(personnel: PersonnelAccessRecord[]): string[] {
  const depts = new Set<string>();
  personnel.forEach((p) => { if (p.department) depts.add(p.department); });
  return Array.from(depts).sort();
}

// ── Main page ─────────────────────────────────────────────────────────────────

function AccessAssignmentsContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PersonnelAccessRecord | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [autoOpenProcessed, setAutoOpenProcessed] = useState(false);

  const { personnel, stats, isLoading } = usePersonnelAccess();

  // Deep link: ?assign_user=<id>
  const assignUserId = searchParams.get("assign_user");
  useEffect(() => {
    if (assignUserId && personnel.length > 0 && !autoOpenProcessed && !isLoading) {
      const person = personnel.find((p) => p.id === assignUserId);
      if (person) {
        setSelectedPerson(person);
        setSheetOpen(true);
        setAutoOpenProcessed(true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [assignUserId, personnel, isLoading, autoOpenProcessed, setSearchParams]);

  const departments = useMemo(() => getDepartments(personnel), [personnel]);

  const filteredPersonnel = useMemo(() => {
    let list = personnel;

    // Quick filter
    switch (quickFilter) {
      case "users": list = list.filter((p) => p.is_registered_user); break;
      case "personnel": list = list.filter((p) => !p.is_registered_user); break;
      case "has_rooms": list = list.filter((p) => p.room_count > 0); break;
      case "has_keys": list = list.filter((p) => p.key_count > 0); break;
      case "unassigned": list = list.filter((p) => p.room_count === 0 && p.key_count === 0); break;
    }

    // Department filter
    if (activeDept) {
      list = list.filter((p) => p.department === activeDept);
    }

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.department?.toLowerCase().includes(q) ||
          p.title?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [personnel, quickFilter, activeDept, searchQuery]);

  const handlePersonClick = (person: PersonnelAccessRecord) => {
    setSelectedPerson(person);
    setSheetOpen(true);
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Access &amp; Assignments</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage room and key assignments for registered users and court personnel
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatusCard
          statusVariant="info"
          title="Total Personnel"
          value={stats.total}
          subLabel="All staff"
          icon={Users}
        />
        <StatusCard
          statusVariant="operational"
          title="Registered Users"
          value={stats.registeredUsers}
          subLabel="Active accounts"
          icon={UserCheck}
        />
        <StatusCard
          statusVariant={stats.withRoomAccess > 0 ? "info" : "neutral"}
          title="With Room Access"
          value={stats.withRoomAccess}
          subLabel="Assigned rooms"
          icon={DoorOpen}
        />
        <StatusCard
          statusVariant={stats.withKeyAccess > 0 ? "warning" : "neutral"}
          title="With Keys"
          value={stats.withKeyAccess}
          subLabel="Keys issued"
          icon={Key}
        />
      </div>

      {/* Search + Quick Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name, email, title, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Quick filter chips */}
        <div className="flex flex-wrap gap-2" data-tour="personnel-search">
          {QUICK_FILTERS.map((f) => {
            const Icon = f.icon;
            const isActive = quickFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setQuickFilter(f.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                )}
              >
                {Icon && <Icon className="h-3 w-3" />}
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Department chips (only when meaningful) */}
        {departments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {departments.map((dept) => {
              const isActive = activeDept === dept;
              return (
                <button
                  key={dept}
                  onClick={() => setActiveDept(isActive ? null : dept)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-all border",
                    isActive
                      ? "bg-secondary text-secondary-foreground border-secondary-foreground/30 font-medium"
                      : "bg-muted/50 text-muted-foreground border-transparent hover:border-border hover:text-foreground"
                  )}
                >
                  {dept}
                  {isActive && <X className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Results count */}
        {!isLoading && (
          <p className="text-xs text-muted-foreground">
            Showing {filteredPersonnel.length} of {stats.total} people
          </p>
        )}
      </div>

      {/* Person grid */}
      <PersonnelGrid
        personnel={filteredPersonnel}
        isLoading={isLoading}
        onPersonClick={handlePersonClick}
      />

      {/* Detail sheet */}
      <PersonDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        person={selectedPerson}
      />
    </div>
  );
}

export default function AccessAssignments() {
  return (
    <RoleBasedRoute feature="occupants">
      <AccessAssignmentsContent />
    </RoleBasedRoute>
  );
}
