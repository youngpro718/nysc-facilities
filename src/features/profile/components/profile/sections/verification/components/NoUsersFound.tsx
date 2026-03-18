
import { AlertCircle } from "lucide-react";

export function NoUsersFound() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
      No users found
    </div>
  );
}
