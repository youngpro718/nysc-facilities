import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
  MagnifyingGlassIcon,
  Pencil1Icon,
  PersonIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ModalFrame } from "@shared/components/common/common/ModalFrame";
import { useToast } from "@shared/hooks/use-toast";
import {
  KeyPersonnelRow,
  listKeyPersonnel,
  saveKeyPersonnel,
} from "@features/court/services/keyPersonnelManagement";
import { ChambersMovePlanner } from "./ChambersMovePlanner";

type PersonnelRole = "judge" | "sergeant" | "clerk" | "officer";
type PersonnelFilter = "all" | "judge" | "sergeant" | "clerk";

interface PersonnelFormState {
  fullName: string;
  role: PersonnelRole;
  title: string;
  department: string;
  chambersRoom: string;
  courtAttorney: string;
}

const defaultForm: PersonnelFormState = {
  fullName: "",
  role: "judge",
  title: "Justice",
  department: "Supreme Criminal Term",
  chambersRoom: "",
  courtAttorney: "",
};

const roleLabels: Record<PersonnelFilter, string> = {
  all: "All",
  judge: "Judges",
  sergeant: "Sergeants",
  clerk: "Clerks",
};

const roleTitleDefaults: Record<PersonnelRole, string> = {
  judge: "Justice",
  sergeant: "Sergeant",
  clerk: "Court Clerk",
  officer: "Court Officer",
};

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

function makeDisplayName(fullName: string, role: PersonnelRole) {
  const { firstName, lastName } = splitName(fullName);
  if (role === "judge" && firstName && lastName) {
    return `${firstName.charAt(0).toUpperCase()}. ${lastName.toUpperCase()}`;
  }
  return fullName.trim();
}

function normalizeRole(role: string | null): PersonnelRole {
  const value = (role || "").toLowerCase();
  if (value.includes("judge") || value.includes("justice")) return "judge";
  if (value.includes("sergeant")) return "sergeant";
  if (value.includes("officer")) return "officer";
  return "clerk";
}

export function KeyPersonnelPanel({ canEdit }: { canEdit: boolean }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<PersonnelFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<KeyPersonnelRow | null>(null);
  const [form, setForm] = useState<PersonnelFormState>(defaultForm);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: personnel = [], isLoading, error } = useQuery({
    queryKey: ["key-personnel"],
    queryFn: listKeyPersonnel,
  });

  const visiblePersonnel = useMemo(() => {
    const query = search.trim().toLowerCase();
    return personnel.filter((person) => {
      const normalizedRole = normalizeRole(person.primary_role);
      const matchesRole =
        roleFilter === "all" ||
        normalizedRole === roleFilter ||
        (roleFilter === "sergeant" && normalizedRole === "officer");
      const haystack = [
        person.full_name,
        person.display_name,
        person.title,
        person.department,
        person.chambers_room_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesRole && (!query || haystack.includes(query));
    });
  }, [personnel, roleFilter, search]);

  const counts = useMemo(
    () => ({
      all: personnel.length,
      judge: personnel.filter((person) => normalizeRole(person.primary_role) === "judge").length,
      sergeant: personnel.filter((person) =>
        ["sergeant", "officer"].includes(normalizeRole(person.primary_role)),
      ).length,
      clerk: personnel.filter((person) => normalizeRole(person.primary_role) === "clerk").length,
    }),
    [personnel],
  );

  const savePerson = useMutation({
    mutationFn: async () => {
      const fullName = form.fullName.trim();
      const { firstName, lastName } = splitName(fullName);
      if (!firstName || !lastName) {
        throw new Error("Enter both a first and last name.");
      }

      const payload = {
        first_name: firstName,
        last_name: lastName,
        display_name: makeDisplayName(fullName, form.role),
        primary_role: form.role,
        title: form.title.trim() || roleTitleDefaults[form.role],
        department: form.department.trim() || null,
        chambers_room_number:
          form.role === "judge" ? form.chambersRoom.trim() || null : null,
        court_attorney:
          form.role === "judge" ? form.courtAttorney.trim() || null : null,
        is_active: true,
        is_available_for_assignment: true,
        ...(form.role === "judge" ? { judge_status: "active" } : {}),
      };

      return saveKeyPersonnel(payload, editingPerson?.id);
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries({ queryKey: ["key-personnel"] });
      queryClient.invalidateQueries({ queryKey: ["court-personnel"] });
      setDialogOpen(false);
      setEditingPerson(null);
      setForm(defaultForm);
      toast({
        title: action === "added" ? "Person added" : "Personnel updated",
        description: "Court operations personnel is now up to date.",
      });
    },
    onError: (saveError: Error) => {
      toast({
        title: "Could not save personnel",
        description: saveError.message,
        variant: "destructive",
      });
    },
  });

  const openAddDialog = () => {
    setEditingPerson(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEditDialog = (person: KeyPersonnelRow) => {
    const role = normalizeRole(person.primary_role);
    setEditingPerson(person);
    setForm({
      fullName: person.full_name || person.display_name || "",
      role,
      title: person.title || roleTitleDefaults[role],
      department: person.department || "",
      chambersRoom: person.chambers_room_number || "",
      courtAttorney: person.court_attorney || "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <ChambersMovePlanner personnel={personnel} canEdit={canEdit} />

      <section className="overflow-hidden rounded-md border border-border bg-card">
      <div className="grid gap-5 border-b border-border bg-muted/20 px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:px-6">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <PersonIcon className="h-4 w-4" />
            Court directory
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Key Personnel</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Judges, sergeants, officers, and clerks used for chambers and courtroom assignments.
          </p>
        </div>
        {canEdit && (
          <Button onClick={openAddDialog} className="active:translate-y-px">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add person
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-md bg-muted p-1">
          {(Object.keys(roleLabels) as PersonnelFilter[]).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`whitespace-nowrap rounded px-3 py-1.5 text-xs font-medium transition-colors active:translate-y-px ${
                roleFilter === role
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {roleLabels[role]}
              <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">
                {counts[role]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, room, or title"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid gap-3 px-4 py-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:px-6">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium">Personnel could not be loaded.</p>
          <p className="mt-1 text-xs text-muted-foreground">{String(error)}</p>
        </div>
      ) : visiblePersonnel.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="text-sm font-medium">No matching personnel</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Adjust the filter or add the first person in this category.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          <div className="hidden grid-cols-[1.4fr_1fr_1fr_auto] gap-4 px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground md:grid">
            <span>Name</span>
            <span>Role</span>
            <span>Location</span>
            <span className="sr-only">Actions</span>
          </div>
          {visiblePersonnel.map((person) => {
            const active = person.is_active !== false;
            const location = person.chambers_room_number
              ? `Chambers ${person.chambers_room_number}`
              : person.department || "Not assigned";

            return (
              <div
                key={person.id}
                className="grid gap-3 px-4 py-4 transition-colors hover:bg-muted/25 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center md:gap-4 md:px-6"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">
                      {person.full_name || person.display_name || "Unnamed"}
                    </p>
                    {active && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                  </div>
                  {person.display_name && person.display_name !== person.full_name && (
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {person.display_name}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {person.title || person.primary_role || "Staff"}
                  </Badge>
                  {!active && <Badge variant="secondary">Inactive</Badge>}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm">{location}</p>
                  {person.court_attorney && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      Court attorney: {person.court_attorney}
                    </p>
                  )}
                </div>

                {canEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(person)}
                    aria-label={`Edit ${person.full_name || person.display_name}`}
                    className="justify-self-start active:translate-y-px md:justify-self-end"
                  >
                    <Pencil1Icon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

        <ModalFrame
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingPerson ? "Edit key personnel" : "Add key personnel"}
        description="Keep this directory limited to people needed for court operations and room assignments."
        size="md"
      >
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            savePerson.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="personnel-name">Full name</Label>
            <Input
              id="personnel-name"
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              placeholder="First and last name"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Operational role</Label>
              <Select
                value={form.role}
                onValueChange={(role: PersonnelRole) =>
                  setForm((current) => ({
                    ...current,
                    role,
                    title: roleTitleDefaults[role],
                    chambersRoom: role === "judge" ? current.chambersRoom : "",
                    courtAttorney: role === "judge" ? current.courtAttorney : "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="judge">Judge</SelectItem>
                  <SelectItem value="sergeant">Sergeant</SelectItem>
                  <SelectItem value="officer">Court Officer</SelectItem>
                  <SelectItem value="clerk">Court Clerk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personnel-title">Title</Label>
              <Input
                id="personnel-title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder={roleTitleDefaults[form.role]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="personnel-department">Department or court</Label>
            <Input
              id="personnel-department"
              value={form.department}
              onChange={(event) =>
                setForm((current) => ({ ...current, department: event.target.value }))
              }
              placeholder="Supreme Criminal Term"
            />
          </div>

          {form.role === "judge" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="personnel-chambers">Chambers room</Label>
                <Input
                  id="personnel-chambers"
                  value={form.chambersRoom}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, chambersRoom: event.target.value }))
                  }
                  placeholder="e.g. 757"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personnel-attorney">Court attorney</Label>
                <Input
                  id="personnel-attorney"
                  value={form.courtAttorney}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, courtAttorney: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={savePerson.isPending || !form.fullName.trim()}>
              {savePerson.isPending
                ? "Saving..."
                : editingPerson
                  ? "Save changes"
                  : "Add person"}
            </Button>
          </div>
        </form>
        </ModalFrame>
      </section>
    </div>
  );
}
