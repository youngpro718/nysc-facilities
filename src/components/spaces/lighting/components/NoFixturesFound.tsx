
import { Card } from "@/components/ui/card";

export function NoFixturesFound() {
  return (
    <Card className="p-8">
      <div className="text-center text-muted-foreground">
        No lighting fixtures found. Add fixtures to get started.
      </div>
    </Card>
  );
}
