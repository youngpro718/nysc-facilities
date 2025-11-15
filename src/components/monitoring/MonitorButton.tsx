import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useMonitoring } from "@/hooks/useMonitoring";
import { useAuth } from "@/hooks/useAuth";

interface MonitorButtonProps {
  itemType: string;
  itemId: string;
  itemName: string;
  itemDescription?: string;
  criteria?: Record<string, any>;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
}

export const MonitorButton = ({
  itemType,
  itemId,
  itemName,
  itemDescription,
  criteria,
  size = "sm",
  variant = "outline",
}: MonitorButtonProps) => {
  const [isMonitored, setIsMonitored] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { addToMonitoring, removeFromMonitoring, checkIsMonitored, isLoading } = useMonitoring();
  const { user } = useAuth();

  const checkStatus = useCallback(async () => {
    if (!user) {
      setIsMonitored(false);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    try {
      const monitored = await checkIsMonitored(itemType, itemId);
      setIsMonitored(monitored);
    } catch (error) {
      console.warn("Error checking monitoring status:", error);
      setIsMonitored(false);
    } finally {
      setIsChecking(false);
    }
  }, [itemType, itemId, checkIsMonitored, user]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleToggleMonitoring = async () => {
    if (!user) return;

    if (isMonitored) {
      const success = await removeFromMonitoring(itemType, itemId);
      if (success) {
        setIsMonitored(false);
      }
    } else {
      const success = await addToMonitoring(
        itemType,
        itemId,
        itemName,
        itemDescription,
        criteria
      );
      if (success) {
        setIsMonitored(true);
      }
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Button
      onClick={handleToggleMonitoring}
      disabled={isLoading || isChecking}
      size={size}
      variant={variant}
      className={isMonitored ? "bg-primary/10 text-primary border-primary" : ""}
    >
      {isLoading || isChecking ? (
        <>
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          {isChecking ? "Checking..." : "Loading..."}
        </>
      ) : isMonitored ? (
        <>
          <EyeOff className="h-4 w-4 mr-1" />
          Unmonitor
        </>
      ) : (
        <>
          <Eye className="h-4 w-4 mr-1" />
          Monitor
        </>
      )}
    </Button>
  );
};