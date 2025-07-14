import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useMonitoring } from "@/hooks/useMonitoring";

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
  const { addToMonitoring, removeFromMonitoring, checkIsMonitored, isLoading } = useMonitoring();

  useEffect(() => {
    const checkStatus = async () => {
      const monitored = await checkIsMonitored(itemType, itemId);
      setIsMonitored(monitored);
    };
    checkStatus();
  }, [itemType, itemId, checkIsMonitored]);

  const handleToggleMonitoring = async () => {
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

  return (
    <Button
      onClick={handleToggleMonitoring}
      disabled={isLoading}
      size={size}
      variant={variant}
      className={isMonitored ? "bg-primary/10 text-primary border-primary" : ""}
    >
      {isMonitored ? (
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