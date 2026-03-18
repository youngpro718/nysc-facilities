/**
 * PendingUsersAlert - Alert banner for pending user approvals
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface PendingUsersAlertProps {
  pendingCount: number;
  onReviewClick: () => void;
  isVisible: boolean;
}

export function PendingUsersAlert({ pendingCount, onReviewClick, isVisible }: PendingUsersAlertProps) {
  if (!isVisible || pendingCount === 0) {
    return null;
  }

  return (
    <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 dark:bg-amber-900 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200">
                {pendingCount} Users Awaiting Approval
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                New users are waiting for your approval to access the system
              </p>
            </div>
          </div>
          <Button 
            onClick={onReviewClick}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Review Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
