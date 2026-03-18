import { CurrentIssuesDisplay } from "../CurrentIssuesDisplay";

interface CurrentIssuesStepProps {
  roomId?: string;
}

export function CurrentIssuesStep({ roomId }: CurrentIssuesStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Current Issues</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Active maintenance and operational issues for this room
        </p>
      </div>

      <CurrentIssuesDisplay roomId={roomId} />
    </div>
  );
}
