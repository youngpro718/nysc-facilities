import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { logger } from '@/lib/logger';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@features/auth/hooks/useAuth";
import { ModalFrame } from "@shared/components/common/common/ModalFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { usePhotoUpload } from "@features/issues/components/issues/hooks/usePhotoUpload";
import { IssuePhotoGrid } from "@features/issues/components/issues/card/IssuePhotoGrid";
import {
  Zap,
  Droplets,
  Thermometer,
  Wrench,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Wifi,
  Bug,
  Building2,
  DoorOpen,
  ClipboardList,
  Search,
  MapPin,
  Loader2,
  CheckCircle,
  X,
  Camera,
  User,
  RotateCcw,
  Siren,
} from "lucide-react";

interface ReportIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RoomResult {
  id: string;
  room_number: string;
  name: string | null;
  floor_id: string | null;
  floors: {
    id: string;
    building_id: string;
    buildings: { id: string; name: string } | null;
  } | null;
}

interface BuildingOption {
  id: string;
  name: string;
}

interface StaffOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

const ISSUE_TYPES = [
  { id: "ELECTRICAL", label: "Electrical",     icon: Zap,          color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/30",  border: "border-yellow-200 dark:border-yellow-800" },
  { id: "PLUMBING",   label: "Plumbing",        icon: Droplets,     color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-950/30",      border: "border-blue-200 dark:border-blue-800" },
  { id: "HVAC",       label: "HVAC",            icon: Thermometer,  color: "text-cyan-500",   bg: "bg-cyan-50 dark:bg-cyan-950/30",      border: "border-cyan-200 dark:border-cyan-800" },
  { id: "MAINTENANCE",label: "Maintenance",     icon: Wrench,       color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30",  border: "border-orange-200 dark:border-orange-800" },
  { id: "CLEANING",   label: "Cleaning",        icon: Sparkles,     color: "text-green-500",  bg: "bg-green-50 dark:bg-green-950/30",    border: "border-green-200 dark:border-green-800" },
  { id: "SAFETY",     label: "Safety",          icon: AlertTriangle,color: "text-red-500",    bg: "bg-red-50 dark:bg-red-950/30",        border: "border-red-200 dark:border-red-800" },
  { id: "SECURITY",   label: "Security",        icon: ShieldAlert,  color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30",  border: "border-purple-200 dark:border-purple-800" },
  { id: "IT_TECH",    label: "IT / Tech",       icon: Wifi,         color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/30",  border: "border-indigo-200 dark:border-indigo-800" },
  { id: "PEST",       label: "Pest Control",    icon: Bug,          color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-950/30",    border: "border-amber-200 dark:border-amber-800" },
  { id: "STRUCTURAL", label: "Structural",      icon: Building2,    color: "text-stone-500",  bg: "bg-stone-50 dark:bg-stone-950/30",    border: "border-stone-200 dark:border-stone-800" },
  { id: "DOOR_LOCK",  label: "Door / Lock",     icon: DoorOpen,     color: "text-slate-500",  bg: "bg-slate-50 dark:bg-slate-950/30",    border: "border-slate-200 dark:border-slate-800" },
  { id: "GENERAL",    label: "General",         icon: ClipboardList,color: "text-gray-500",   bg: "bg-gray-50 dark:bg-gray-950/30",      border: "border-gray-200 dark:border-gray-800" },
] as const;

const PRIORITY_OPTIONS = [
  { id: "low",      label: "Low",      description: "Non-urgent, schedule when convenient",  badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { id: "medium",   label: "Medium",   description: "Needs attention within a few days",     badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  { id: "high",     label: "High",     description: "Address within 24 hours",               badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  { id: "critical", label: "Critical", description: "Immediate action required",             badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
] as const;

const reportIssueSchema = z.object({
  title: z.string().min(1, "Issue title is required"),
  description: z.string().optional(),
  issue_type: z.string().min(1, "Please select an issue type"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  space_type: z.enum(["courtroom", "room", "hallway", "door", "building", "other"]),
  space_name: z.string().optional(),
  room_id: z.string().optional(),
  building_id: z.string().optional(),
  floor_id: z.string().optional(),
  reported_by_name: z.string().optional(),
  assigned_to: z.string().optional(),
  recurring_issue: z.boolean(),
  needs_immediate_attention: z.boolean(),
  additional_notes: z.string().optional(),
});

type FormData = z.infer<typeof reportIssueSchema>;

export const ReportIssueDialog = ({ open, onOpenChange }: ReportIssueDialogProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { uploading, selectedPhotos, setSelectedPhotos, handlePhotoUpload } = usePhotoUpload();

  const [roomSearch, setRoomSearch] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<RoomResult | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(reportIssueSchema),
    defaultValues: {
      title: "",
      description: "",
      issue_type: "",
      priority: "medium",
      space_type: "room",
      space_name: "",
      room_id: "",
      building_id: "",
      floor_id: "",
      reported_by_name: "",
      assigned_to: "",
      recurring_issue: false,
      needs_immediate_attention: false,
      additional_notes: "",
    },
  });

  const spaceType = form.watch("space_type");
  const selectedIssueType = form.watch("issue_type");
  const selectedPriority = form.watch("priority");

  // Fetch rooms for live search
  const { data: allRooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ["report-issue-dialog-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unified_spaces")
        .select(`id, room_number, name, floor_id, floors!inner(id, building_id, buildings!inner(id, name))`)
        .eq("space_type", "room")
        .order("room_number");
      if (error) throw error;
      return (data as unknown as RoomResult[]) || [];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch buildings
  const { data: buildings = [] } = useQuery<BuildingOption[]>({
    queryKey: ["buildings-for-report-issue"],
    queryFn: async () => {
      const { data, error } = await supabase.from("buildings").select("id, name").order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: open,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch staff for assignment
  const { data: staffList = [] } = useQuery<StaffOption[]>({
    queryKey: ["staff-for-report-issue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("role", ["admin", "court_officer", "cmc"])
        .order("last_name");
      if (error) throw error;
      return data || [];
    },
    enabled: open,
    staleTime: 10 * 60 * 1000,
  });

  // Live room search filter
  const filteredRooms = useMemo(() => {
    if (!roomSearch.trim()) return [];
    const q = roomSearch.toLowerCase();
    return allRooms
      .filter((r) => r.room_number?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q))
      .slice(0, 10);
  }, [allRooms, roomSearch]);

  const handleRoomSelect = (room: RoomResult) => {
    setSelectedRoom(room);
    setRoomSearch("");
    form.setValue("room_id", room.id);
    form.setValue("floor_id", room.floor_id || "");
    form.setValue("building_id", room.floors?.building_id || "");
    form.setValue("space_name", room.room_number);
  };

  const clearRoom = () => {
    setSelectedRoom(null);
    form.setValue("room_id", "");
    form.setValue("floor_id", "");
    form.setValue("space_name", "");
  };

  // Auto-generate title when issue_type + room are both set
  const autoGenerateTitle = (issueTypeId: string) => {
    const typeLabel = ISSUE_TYPES.find((t) => t.id === issueTypeId)?.label || issueTypeId;
    const location = selectedRoom?.room_number || form.getValues("space_name") || "";
    if (!form.getValues("title") && typeLabel && location) {
      form.setValue("title", `${typeLabel} Issue – ${location}`);
    }
  };

  const resetForm = () => {
    form.reset();
    setSelectedRoom(null);
    setRoomSearch("");
    setSelectedPhotos([]);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase.from("issues").insert({
        title: data.title,
        description: [
          data.description,
          data.additional_notes ? `Additional notes: ${data.additional_notes}` : null,
          data.reported_by_name ? `Reported by: ${data.reported_by_name}` : null,
        ].filter(Boolean).join("\n\n") || null,
        issue_type: data.issue_type,
        priority: data.priority,
        status: "open",
        room_id: data.room_id || null,
        floor_id: data.floor_id || null,
        building_id: data.building_id || null,
        assigned_to: (data.assigned_to && data.assigned_to !== "unassigned") ? data.assigned_to : null,
        reported_by: user?.id || null,
        photos: selectedPhotos.length > 0 ? selectedPhotos : null,
      });

      if (error) throw error;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["issues"] }),
        queryClient.invalidateQueries({ queryKey: ["adminIssues"] }),
        queryClient.invalidateQueries({ queryKey: ["maintenance-issues"] }),
        queryClient.invalidateQueries({ queryKey: ["court-issues"] }),
        queryClient.invalidateQueries({ queryKey: ["interactive-operations"] }),
      ]);

      setShowSuccess(true);
      setTimeout(() => {
        resetForm();
        onOpenChange(false);
        setShowSuccess(false);
      }, 1200);

      toast.success("Issue reported successfully", { description: data.title });
    } catch (err) {
      logger.error("Error reporting issue:", err);
      toast.error("Failed to report issue", { description: "Please try again." });
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  // Success state
  if (showSuccess) {
    return (
      <ModalFrame open={open} onOpenChange={handleClose} title="Report Issue" size="xl">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-5 mb-4">
            <CheckCircle className="h-14 w-14 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold">Issue Logged Successfully</h3>
          <p className="text-muted-foreground text-sm mt-1">It has been added to the operations queue.</p>
        </div>
      </ModalFrame>
    );
  }

  return (
    <ModalFrame
      open={open}
      onOpenChange={handleClose}
      title="Report a Building Issue"
      description="Log an issue reported to you. Fill in as much detail as possible for the maintenance team."
      size="xl"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

            {/* ── LEFT COLUMN: Issue Details ── */}
            <div className="space-y-5">

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Issue Title <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Broken light fixture in Courtroom 3"
                        className="text-base"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">What's happening?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the issue in detail — what you see, when it started, how it affects operations..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Issue Type Grid */}
              <div>
                <FormField
                  control={form.control}
                  name="issue_type"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Issue Category <span className="text-destructive">*</span></FormLabel>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                        {ISSUE_TYPES.map((type) => {
                          const Icon = type.icon;
                          const isSelected = selectedIssueType === type.id;
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => {
                                form.setValue("issue_type", type.id, { shouldValidate: true });
                                autoGenerateTitle(type.id);
                              }}
                              className={cn(
                                "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center",
                                "hover:border-primary/40 hover:bg-accent/40",
                                isSelected
                                  ? `border-primary ${type.bg}`
                                  : "border-border bg-background"
                              )}
                            >
                              <Icon className={cn("h-5 w-5", isSelected ? type.color : "text-muted-foreground")} />
                              <span className={cn("text-xs font-medium leading-tight", isSelected ? "text-foreground" : "text-muted-foreground")}>
                                {type.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Priority */}
              <div>
                <p className="text-sm font-semibold mb-2">Priority Level <span className="text-destructive">*</span></p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRIORITY_OPTIONS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => form.setValue("priority", p.id, { shouldValidate: true })}
                      className={cn(
                        "flex flex-col gap-1 p-3 rounded-lg border-2 text-left transition-all",
                        "hover:border-primary/40",
                        selectedPriority === p.id ? "border-primary bg-accent/50" : "border-border"
                      )}
                    >
                      <Badge className={cn("text-xs w-fit font-semibold", p.badge)}>{p.label}</Badge>
                      <span className="text-xs text-muted-foreground leading-tight">{p.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Flags */}
              <div className="flex flex-col sm:flex-row gap-4 pt-1">
                <FormField
                  control={form.control}
                  name="recurring_issue"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div>
                        <FormLabel className="font-normal cursor-pointer flex items-center gap-1.5">
                          <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                          Recurring issue
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="needs_immediate_attention"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div>
                        <FormLabel className="font-normal cursor-pointer flex items-center gap-1.5">
                          <Siren className="h-3.5 w-3.5 text-muted-foreground" />
                          Needs immediate attention
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── RIGHT COLUMN: Location & Meta ── */}
            <div className="space-y-5 lg:border-l lg:pl-6">

              {/* Location Header */}
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Location
                </p>

                {/* Space Type */}
                <FormField
                  control={form.control}
                  name="space_type"
                  render={({ field }) => (
                    <FormItem className="mb-3">
                      <FormLabel className="text-xs text-muted-foreground">Space Type</FormLabel>
                      <Select onValueChange={(v) => { field.onChange(v); clearRoom(); }} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="courtroom">Courtroom</SelectItem>
                          <SelectItem value="room">Room / Office</SelectItem>
                          <SelectItem value="hallway">Hallway / Corridor</SelectItem>
                          <SelectItem value="door">Door / Entrance</SelectItem>
                          <SelectItem value="building">Entire Building / Exterior</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Room search (when space_type = room or courtroom) */}
                {(spaceType === "room" || spaceType === "courtroom") && (
                  <div className="space-y-2">
                    {selectedRoom ? (
                      <div className="flex items-center justify-between p-2.5 bg-primary/10 border border-primary/20 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span className="font-medium">{selectedRoom.room_number}</span>
                          {selectedRoom.name && <span className="text-muted-foreground">— {selectedRoom.name}</span>}
                          {selectedRoom.floors?.buildings?.name && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{selectedRoom.floors.buildings.name}</Badge>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" type="button" onClick={clearRoom} className="h-6 w-6 p-0">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Search room number or name…"
                            value={roomSearch}
                            onChange={(e) => setRoomSearch(e.target.value)}
                            className="pl-9 text-sm"
                          />
                        </div>
                        {roomSearch && (
                          <ScrollArea className="h-40 border rounded-lg bg-background">
                            {roomsLoading ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                            ) : filteredRooms.length === 0 ? (
                              <p className="py-6 text-center text-xs text-muted-foreground">No rooms found</p>
                            ) : (
                              <div className="p-1.5 space-y-0.5">
                                {filteredRooms.map((room) => (
                                  <button
                                    key={room.id}
                                    type="button"
                                    onClick={() => handleRoomSelect(room)}
                                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm transition-colors"
                                  >
                                    <span className="font-medium">{room.room_number}</span>
                                    {room.name && <span className="text-muted-foreground ml-1.5 text-xs">— {room.name}</span>}
                                    {room.floors?.buildings?.name && (
                                      <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0">{room.floors.buildings.name}</Badge>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Building select (for hallway/door/building) */}
                {(spaceType === "hallway" || spaceType === "door" || spaceType === "building") && (
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="building_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Building</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select building" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {buildings.map((b) => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="space_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Location detail (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 2nd floor hallway near stairwell B" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Free text for 'other' */}
                {spaceType === "other" && (
                  <FormField
                    control={form.control}
                    name="space_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Location description</FormLabel>
                        <FormControl>
                          <Input placeholder="Describe where the issue is located" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <Separator />

              {/* Reporter */}
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Reporter
                </p>
                <FormField
                  control={form.control}
                  name="reported_by_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Reported by (name or position)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Judge Williams, Clerk on duty, Anonymous" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Assignment */}
              <div>
                <p className="text-sm font-semibold mb-3">Assign To</p>
                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Assign to staff member (optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {staffList.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {[s.first_name, s.last_name].filter(Boolean).join(" ") || s.email || s.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Additional Notes */}
              <FormField
                control={form.control}
                name="additional_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Anything else the maintenance team should know…" rows={3} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Photo Upload */}
              <div>
                <p className="text-sm font-semibold mb-2">Attach Photos</p>
                <label className="cursor-pointer block">
                  <div className={cn(
                    "flex flex-col items-center justify-center h-20 border-2 border-dashed rounded-lg transition-colors",
                    uploading ? "border-primary/50 bg-primary/5" : "border-border bg-muted/30 hover:bg-muted/50"
                  )}>
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <>
                        <Camera className="h-5 w-5 mb-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Click to attach photos</span>
                      </>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {selectedPhotos.length > 0 && (
                  <div className="mt-2">
                    <IssuePhotoGrid photos={selectedPhotos} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t">
            <Button type="button" variant="ghost" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || uploading}
              size="lg"
              className="min-w-[140px]"
            >
              {form.formState.isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</>
              ) : (
                "Submit Issue Report"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </ModalFrame>
  );
};
