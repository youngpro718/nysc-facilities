import { useState, useEffect } from "react";
import { logger } from '@/lib/logger';
import { supabase } from "@/lib/supabase";
import { AdminStats } from "../types";
import { toast } from "sonner";

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>({
    activeUsers: 0,
    pendingIssues: 0,
    totalKeys: 0,
    managedBuildings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        { data: activeUsersData, error: activeUsersError },
        { data: pendingIssuesData, error: pendingIssuesError },
        { data: keysData, error: keysError },
        { data: buildingsData, error: buildingsError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id")
          .eq("verification_status", "verified"),
        supabase
          .from("issues")
          .select("id")
          .eq("status", "open"),
        supabase
          .from("keys")
          .select("id")
          .eq("status", "available"),
        supabase
          .from("buildings")
          .select("id")
          .eq("status", "active"),
      ]);

      // Check for errors
      if (activeUsersError) throw activeUsersError;
      if (pendingIssuesError) throw pendingIssuesError;
      if (keysError) throw keysError;
      if (buildingsError) throw buildingsError;

      setStats({
        activeUsers: activeUsersData?.length || 0,
        pendingIssues: pendingIssuesData?.length || 0,
        totalKeys: keysData?.length || 0,
        managedBuildings: buildingsData?.length || 0,
      });
    } catch (error) {
      logger.error("Error fetching admin stats:", error);
      setError("Failed to fetch admin statistics");
      toast.error("Failed to fetch admin statistics");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats
  };
}
