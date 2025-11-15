import { useState } from "react";
import { WalkthroughNavigator } from "./WalkthroughNavigator";
import { ActiveWalkthroughView } from "./ActiveWalkthroughView";

export function MobileWalkthroughPage() {
  const [activeSession, setActiveSession] = useState<{
    sessionId: string;
    hallwayId: string;
    floorId: string;
  } | null>(null);

  const handleStartWalkthrough = (sessionId: string, hallwayId: string, floorId: string) => {
    setActiveSession({ sessionId, hallwayId, floorId });
  };

  const handleComplete = () => {
    setActiveSession(null);
  };

  const handleCancel = () => {
    setActiveSession(null);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {!activeSession ? (
          <WalkthroughNavigator onStartWalkthrough={handleStartWalkthrough} />
        ) : (
          <ActiveWalkthroughView
            sessionId={activeSession.sessionId}
            hallwayId={activeSession.hallwayId}
            floorId={activeSession.floorId}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}
