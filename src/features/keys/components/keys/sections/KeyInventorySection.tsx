import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from "@/lib/logger";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { KeyData, KeyFilterOptions, SortOption } from "../types/KeyTypes";
import { toast } from "sonner";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { KeyFilters } from "../KeyFilters";
import { CreateKeyDialog } from "../CreateKeyDialog";
import { KeyInventoryHeader } from "./inventory/KeyInventoryHeader";
import { DeleteKeyDialog } from "./inventory/DeleteKeyDialog";
import { KeysSidebarList } from "./inventory/KeysSidebarList";
import { KeyDetailPanel } from "./inventory/KeyDetailPanel";
import { ImportKeysDialog } from "@features/keys/components/keys/dialogs/ImportKeysDialog";
import { useRolePermissions } from "@features/auth/hooks/useRolePermissions";

export function KeyInventorySection() {
  const { canAdmin } = useRolePermissions();
  const canManage = canAdmin("keys");
  const [keyToDelete, setKeyToDelete] = useState<KeyData | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [filters, setFilters] = useState<KeyFilterOptions>({});
  const [sort, setSort] = useState<SortOption>({
    field: "name",
    direction: "asc",
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const urlKeyId = searchParams.get("key");
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(urlKeyId);

  const { data: keys, isLoading, refetch } = useQuery({
    queryKey: ["keys-inventory", filters, sort],
    queryFn: async () => {
      try {
        let keysQuery = supabase.from("key_statistics_view").select("*");

        if (filters.type && filters.type !== "all_types") {
          keysQuery = keysQuery.eq("type", filters.type);
        }
        if (
          filters.captainOfficeCopy &&
          filters.captainOfficeCopy !== "all"
        ) {
          keysQuery = keysQuery.eq(
            "captain_office_copy",
            filters.captainOfficeCopy === "has_copy"
          );
        }
        keysQuery = keysQuery.order(sort.field, {
          ascending: sort.direction === "asc",
        });

        const { data: keysData, error: keysError } = await keysQuery;
        if (keysError) {
          logger.error("Error fetching keys:", keysError);
          throw keysError;
        }
        return keysData as KeyData[];
      } catch (error) {
        logger.error("Error in query:", error);
        toast.error("Failed to fetch keys inventory");
        return [];
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Sync selection with URL + list
  useEffect(() => {
    const list = keys ?? [];
    if (urlKeyId) {
      const found = list.find((k) => k.id === urlKeyId);
      if (found && found.id !== selectedKeyId) {
        setSelectedKeyId(found.id);
        return;
      }
    }
    if (selectedKeyId && list.some((k) => k.id === selectedKeyId)) return;
    if (list.length > 0) setSelectedKeyId(list[0].id);
    else setSelectedKeyId(null);
  }, [keys, urlKeyId]);

  const selectedKey = useMemo(
    () => (keys ?? []).find((k) => k.id === selectedKeyId) ?? null,
    [keys, selectedKeyId]
  );

  const handleSelect = (k: KeyData) => {
    setSelectedKeyId(k.id);
    const next = new URLSearchParams(searchParams);
    next.set("key", k.id);
    setSearchParams(next, { replace: true });
  };

  const handleDeleteKey = async () => {
    if (!keyToDelete) return;
    try {
      const { error } = await supabase.rpc("safely_delete_key", {
        key_id_to_delete: keyToDelete.id,
      });
      if (error) {
        if (getErrorMessage(error).includes("active assignments")) {
          toast.error("Cannot delete key with active assignments");
        } else {
          toast.error("Error deleting key: " + getErrorMessage(error));
        }
        return;
      }
      toast.success("Key deleted successfully");
      refetch();
    } catch (error) {
      logger.error("Error deleting key:", error);
      toast.error(
        "Error deleting key: " + (getErrorMessage(error) || "Unknown error")
      );
    } finally {
      setKeyToDelete(null);
    }
  };

  const handleForceDeleteKey = async () => {
    if (!keyToDelete) return;
    try {
      const { error: returnErr } = await supabase
        .from("key_assignments")
        .update({ returned_at: new Date().toISOString() })
        .eq("key_id", keyToDelete.id)
        .is("returned_at", null);
      if (returnErr) {
        toast.error("Could not return assignments: " + getErrorMessage(returnErr));
        return;
      }
      const { error } = await supabase.rpc("safely_delete_key", {
        key_id_to_delete: keyToDelete.id,
      });
      if (error) {
        toast.error("Error deleting key: " + getErrorMessage(error));
        return;
      }
      toast.success(`Deleted ${keyToDelete.name} and returned all assignments`);
      refetch();
    } catch (error) {
      logger.error("Error force-deleting key:", error);
      toast.error("Error deleting key: " + (getErrorMessage(error) || "Unknown error"));
    } finally {
      setKeyToDelete(null);
    }
  };

  const handleToggleCaptainOfficeCopy = async (
    keyId: string,
    currentStatus: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("keys")
        .update({
          captain_office_copy: !currentStatus,
          captain_office_assigned_date: !currentStatus
            ? new Date().toISOString()
            : null,
          captain_office_notes: !currentStatus
            ? "Assigned to Captain's Office"
            : null,
        })
        .eq("id", keyId);

      if (error) {
        toast.error(
          "Error updating captain's office status: " + getErrorMessage(error)
        );
        return;
      }

      toast.success(
        !currentStatus
          ? "Key marked as given to Captain's Office"
          : "Key removed from Captain's Office"
      );
      refetch();
    } catch (error) {
      logger.error("Error updating captain's office status:", error);
      toast.error("Error updating captain's office status");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <KeyInventoryHeader
        onAddKey={canManage ? () => setCreateDialogOpen(true) : undefined}
        onImport={canManage ? () => setImportOpen(true) : undefined}
        onExport={() => {
          const rows = (keys || []).map((k) => ({
            id: k.id,
            name: k.name,
            type: k.type,
            status: k.status,
            total_quantity: k.total_quantity,
            available_quantity: k.available_quantity,
            is_passkey: k.is_passkey ? "yes" : "no",
            key_scope: k.key_scope || "",
            active_assignments: (k as any).active_assignments ?? "",
            returned_assignments: (k as any).returned_assignments ?? "",
            lost_count: (k as any).lost_count ?? "",
          }));
          const headers = Object.keys(
            rows[0] || {
              id: "",
              name: "",
              type: "",
              status: "",
              total_quantity: "",
              available_quantity: "",
              is_passkey: "",
              key_scope: "",
              active_assignments: "",
              returned_assignments: "",
              lost_count: "",
            }
          );
          const csv = [
            headers.join(","),
            ...rows.map((r) =>
              headers
                .map((h) => {
                  const val = String(
                    (r as Record<string, unknown>)[h] ?? ""
                  );
                  const escaped = val.replace(/"/g, '""');
                  return `"${escaped}"`;
                })
                .join(",")
            ),
          ].join("\n");
          const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `keys_inventory_${new Date().toISOString()}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        }}
      />

      <KeyFilters onFilterChange={setFilters} onSortChange={setSort} />

      {/* Master/detail */}
      <ResizablePanelGroup
        direction="horizontal"
        className="h-[calc(100svh-440px)] min-h-[460px] rounded-lg border"
      >
        <ResizablePanel defaultSize={32} minSize={24} maxSize={45}>
          <div className="h-full min-h-0">
            <KeysSidebarList
              keys={keys || []}
              selectedKeyId={selectedKeyId}
              onSelect={handleSelect}
              isLoading={isLoading}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={68}>
          <KeyDetailPanel
            selectedKey={selectedKey}
            onDeleteKey={canManage ? setKeyToDelete : undefined}
            onToggleCaptainOfficeCopy={
              canManage ? handleToggleCaptainOfficeCopy : undefined
            }
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <CreateKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refetch}
      />

      <DeleteKeyDialog
        keyToDelete={keyToDelete}
        onOpenChange={() => setKeyToDelete(null)}
        onConfirmDelete={handleDeleteKey}
        onForceDelete={canManage ? handleForceDeleteKey : undefined}
      />

      <ImportKeysDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={refetch}
      />
    </div>
  );
}
