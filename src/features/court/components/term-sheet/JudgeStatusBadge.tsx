import { Badge } from "@/components/ui/badge";
import type { JudgeStatus } from "@features/court/hooks/useCourtPersonnel";

/** Small badge showing judge status (JHO / departed). */
export function JudgeStatusBadge({ status }: { status: JudgeStatus | string }) {
  if (status === "jho") {
    return (
      <Badge
        variant="secondary"
        className="text-[10px] px-1 py-0 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 font-semibold"
      >
        JHO
      </Badge>
    );
  }
  if (status === "departed") {
    return (
      <Badge
        variant="secondary"
        className="text-[10px] px-1 py-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      >
        Departed
      </Badge>
    );
  }
  return null;
}
