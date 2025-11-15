
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { fetchScheduledReports } from "../reportService";
import type { ScheduledReport } from "../types";

export function useScheduledReports() {
  const { toast } = useToast();
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);

  const loadScheduledReports = async () => {
    try {
      const data = await fetchScheduledReports();
      setScheduledReports(data);
    } catch (error) {
      console.error('Error loading scheduled reports:', error);
      toast({
        title: "Error Loading Scheduled Reports",
        description: "Could not load scheduled reports.",
        variant: "destructive",
      });
    }
  };

  return { scheduledReports, loadScheduledReports };
}
