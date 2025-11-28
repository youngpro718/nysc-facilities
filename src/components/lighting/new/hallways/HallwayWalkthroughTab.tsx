import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, ArrowRight, Lightbulb, AlertCircle, CheckCircle } from 'lucide-react';
import { useLightingHallways, useHallwayFixtures } from '@/hooks/useLightingHallways';
import { WalkthroughMode } from './WalkthroughMode';
import { LandmarkSetupDialog } from './LandmarkSetupDialog';

export function HallwayWalkthroughTab() {
  const [selectedHallwayId, setSelectedHallwayId] = useState<string | null>(null);
  const [isWalkthroughActive, setIsWalkthroughActive] = useState(false);

  const { data: hallways, isLoading } = useLightingHallways();
  const { data: fixtures } = useHallwayFixtures(selectedHallwayId);

  // If walkthrough is active, show walkthrough mode
  if (isWalkthroughActive && selectedHallwayId && fixtures) {
    return (
      <WalkthroughMode
        hallwayId={selectedHallwayId}
        fixtures={fixtures}
        onComplete={() => {
          setIsWalkthroughActive(false);
          setSelectedHallwayId(null);
        }}
        onCancel={() => {
          setIsWalkthroughActive(false);
          setSelectedHallwayId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hallway Walkthrough</h2>
          <p className="text-muted-foreground">
            Select a hallway to begin inspecting fixtures in sequence
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading hallways...</p>
        </div>
      ) : !hallways || hallways.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No hallways with fixtures found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {hallways.map((hallway) => {
            const issueCount = hallway.non_functional_count + hallway.maintenance_count;
            const healthPercent = hallway.total_fixtures > 0
              ? Math.round((hallway.functional_count / hallway.total_fixtures) * 100)
              : 100;

            return (
              <Card
                key={hallway.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedHallwayId(hallway.id);
                        setIsWalkthroughActive(true);
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold text-lg">{hallway.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {hallway.floor_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {hallway.total_fixtures} fixtures
                          </span>
                        </div>

                        {issueCount > 0 ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {issueCount} issue{issueCount !== 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3" />
                            All OK
                          </Badge>
                        )}

                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">Health:</div>
                          <div className={`text-sm font-semibold ${
                            healthPercent >= 90 ? 'text-green-600' :
                            healthPercent >= 70 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {healthPercent}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                      <LandmarkSetupDialog
                        hallwayId={hallway.id}
                        hallwayName={hallway.name}
                      />
                      <Button 
                        size="lg"
                        onClick={() => {
                          setSelectedHallwayId(hallway.id);
                          setIsWalkthroughActive(true);
                        }}
                      >
                        <span className="mr-2">Start Walkthrough</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
