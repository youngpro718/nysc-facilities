import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  DoorOpen,
  AlertTriangle,
  Search,
  Loader2,
  Building2,
  Zap,
  Droplets,
  Wrench,
  Bug,
  Flame,
  Sparkles,
  MapPin,
} from "lucide-react";

interface RoomResult {
  id: string;
  name: string;
  room_number: string | null;
  room_type: string;
  status: string;
  floor: { name: string; building: { name: string } | null } | null;
}

interface IssueResult {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  room_id: string | null;
  rooms: { name: string; room_number: string | null } | null;
}

const ISSUE_TYPE_ICONS: Record<string, typeof AlertTriangle> = {
  electrical: Zap,
  plumbing: Droplets,
  hvac: Wrench,
  pest: Bug,
  fire_safety: Flame,
  cleaning: Sparkles,
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-blue-500 text-white",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

interface GlobalSearchPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchPalette({ open, onOpenChange }: GlobalSearchPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [rooms, setRooms] = useState<RoomResult[]>([]);
  const [issues, setIssues] = useState<IssueResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setRooms([]);
      setIssues([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const pattern = `%${query}%`;
        const lowerQuery = query.toLowerCase();

        // Search rooms by text columns (name, room_number)
        const roomQueries = [
          supabase.from("rooms").select("id, name, room_number, room_type, status, floor_id").ilike("name", pattern).limit(8),
          supabase.from("rooms").select("id, name, room_number, room_type, status, floor_id").ilike("room_number", pattern).limit(8),
        ];

        // Also match room_type enum values that contain the query string
        const ROOM_TYPES = [
          "courtroom","judges_chambers","jury_room","conference_room","office",
          "filing_room","male_locker_room","female_locker_room","robing_room",
          "stake_holder","records_room","administrative_office","break_room",
          "it_room","utility_room","laboratory","conference","chamber",
        ];
        const matchingTypes = ROOM_TYPES.filter((t) => t.replace(/_/g, " ").includes(lowerQuery) || t.includes(lowerQuery));
        if (matchingTypes.length > 0) {
          roomQueries.push(
            supabase.from("rooms").select("id, name, room_number, room_type, status, floor_id").in("room_type", matchingTypes).limit(8)
          );
        }

        // Search issues by text columns (title, issue_type, description)
        const issueSelect = "id, title, issue_type, status, priority, room_id";
        const issueQueries = [
          supabase.from("issues").select(issueSelect).ilike("title", pattern).order("created_at", { ascending: false }).limit(10),
          supabase.from("issues").select(issueSelect).ilike("issue_type", pattern).order("created_at", { ascending: false }).limit(10),
          supabase.from("issues").select(issueSelect).ilike("description", pattern).order("created_at", { ascending: false }).limit(10),
        ];

        const results = await Promise.all([...roomQueries, ...issueQueries]);

        // Deduplicate rooms
        const roomMap = new Map<string, Record<string, unknown>>();
        for (let i = 0; i < roomQueries.length; i++) {
          for (const r of results[i].data || []) {
            if (!roomMap.has(r.id)) roomMap.set(r.id, r);
          }
        }
        const uniqueRooms = Array.from(roomMap.values()).slice(0, 8);

        // Fetch floor+building info for matched rooms
        const floorIds = [...new Set(uniqueRooms.map((r) => r.floor_id).filter(Boolean))] as string[];
        let floorMap = new Map<string, { name: string; building_name: string }>();
        if (floorIds.length > 0) {
          const { data: floors } = await supabase
            .from("floors")
            .select("id, name, buildings!floors_building_id_fkey(name)")
            .in("id", floorIds);
          for (const f of floors || []) {
            const bld = Array.isArray(f.buildings) ? f.buildings[0] : f.buildings;
            floorMap.set(f.id, { name: f.name, building_name: (bld as Record<string, string>)?.name || "" });
          }
        }

        setRooms(
          uniqueRooms.map((r) => {
            const fl = floorMap.get(r.floor_id as string);
            return {
              ...r,
              floor: fl ? { name: fl.name, building: { name: fl.building_name } } : null,
            };
          }) as RoomResult[]
        );

        // Deduplicate issues (issue results start after room results)
        const issueMap = new Map<string, Record<string, unknown>>();
        for (let i = roomQueries.length; i < results.length; i++) {
          for (const issue of results[i].data || []) {
            if (!issueMap.has(issue.id)) issueMap.set(issue.id, issue);
          }
        }
        const uniqueIssues = Array.from(issueMap.values()).slice(0, 10);

        // Fetch room info for matched issues
        const issueRoomIds = [...new Set(uniqueIssues.map((i) => i.room_id).filter(Boolean))] as string[];
        let issueRoomMap = new Map<string, { name: string; room_number: string | null }>();
        if (issueRoomIds.length > 0) {
          const { data: issueRooms } = await supabase
            .from("rooms")
            .select("id, name, room_number")
            .in("id", issueRoomIds);
          for (const rm of issueRooms || []) {
            issueRoomMap.set(rm.id, { name: rm.name, room_number: rm.room_number });
          }
        }

        setIssues(
          uniqueIssues.map((i) => ({
            ...i,
            type: (i.issue_type as string) || '',
            rooms: i.room_id ? issueRoomMap.get(i.room_id as string) || null : null,
          })) as IssueResult[]
        );
      } catch {
        // Silently fail — user can retry
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setRooms([]);
      setIssues([]);
    }
  }, [open]);

  const handleSelectRoom = useCallback(
    (room: RoomResult) => {
      onOpenChange(false);
      navigate(`/spaces?room=${room.id}`);
    },
    [navigate, onOpenChange]
  );

  const handleSelectIssue = useCallback(
    (issue: IssueResult) => {
      onOpenChange(false);
      navigate(`/operations?tab=issues&issue_id=${issue.id}`);
    },
    [navigate, onOpenChange]
  );

  const IssueIcon = (type: string) => {
    const Icon = ISSUE_TYPE_ICONS[type] || AlertTriangle;
    return <Icon className="h-4 w-4 shrink-0" />;
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search rooms, issues, keywords…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        {loading && (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Searching…
          </div>
        )}

        {!loading && query.length >= 2 && rooms.length === 0 && issues.length === 0 && (
          <CommandEmpty>No results found for "{query}"</CommandEmpty>
        )}

        {!loading && query.length < 2 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Type at least 2 characters to search
          </div>
        )}

        {/* Rooms */}
        {rooms.length > 0 && (
          <CommandGroup heading="Rooms">
            {rooms.map((room) => {
              const buildingName = room.floor?.building?.name;
              const floorName = room.floor?.name;
              return (
                <CommandItem
                  key={`room-${room.id}`}
                  value={`room-${room.room_number || room.name}-${room.id}`}
                  onSelect={() => handleSelectRoom(room)}
                  className="flex items-center gap-3 py-2.5 cursor-pointer"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-100 dark:bg-blue-900/30 shrink-0">
                    <DoorOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {room.room_number || room.name}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 capitalize shrink-0">
                        {room.room_type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    {(buildingName || floorName) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        {buildingName && (
                          <>
                            <Building2 className="h-3 w-3" />
                            <span>{buildingName}</span>
                          </>
                        )}
                        {buildingName && floorName && <span>·</span>}
                        {floorName && <span>{floorName}</span>}
                      </div>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {rooms.length > 0 && issues.length > 0 && <CommandSeparator />}

        {/* Issues */}
        {issues.length > 0 && (
          <CommandGroup heading="Issues">
            {issues.map((issue) => {
              const roomLabel = issue.rooms
                ? `${issue.rooms.room_number || issue.rooms.name}`
                : null;
              return (
                <CommandItem
                  key={`issue-${issue.id}`}
                  value={`issue-${issue.title}-${issue.type}-${issue.id}`}
                  onSelect={() => handleSelectIssue(issue)}
                  className="flex items-center gap-3 py-2.5 cursor-pointer"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-amber-100 dark:bg-amber-900/30 shrink-0">
                    {IssueIcon(issue.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{issue.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge
                        className={`text-[10px] px-1.5 py-0 h-4 ${PRIORITY_COLORS[issue.priority] || ""}`}
                      >
                        {issue.priority}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-4 ${STATUS_COLORS[issue.status] || ""}`}
                      >
                        {issue.status.replace(/_/g, " ")}
                      </Badge>
                      {roomLabel && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {roomLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
