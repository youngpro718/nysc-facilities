/**
 * DashboardProfileSummaryCard — the user's identity block as a rail card.
 * Same fields CompactHeader already renders; no new data.
 */
import { Card, CardContent } from "@/components/ui/card";
import { CompactHeader } from "@shared/components/user/CompactHeader";

interface Props {
  firstName: string;
  lastName?: string;
  title?: string;
  department?: string;
  roomNumber?: string;
  avatarUrl?: string;
  role?: string;
}

export function DashboardProfileSummaryCard(props: Props) {
  return (
    <Card>
      <CardContent className="p-4">
        <CompactHeader {...props} />
      </CardContent>
    </Card>
  );
}
