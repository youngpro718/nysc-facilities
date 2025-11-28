import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DoorOpen, Lightbulb, CheckCircle, XCircle, AlertTriangle, Zap } from 'lucide-react';
import { LightingFixture } from '@/types/lighting';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface RoomDetailViewProps {
  room: {
    id: string;
    name: string;
    room_number: string | null;
    floor_name: string;
    building_name: string;
    total_fixtures: number;
    functional_count: number;
    non_functional_count: number;
    maintenance_count: number;
  };
  fixtures: LightingFixture[];
}

export function RoomDetailView({ room, fixtures }: RoomDetailViewProps) {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ fixtureId, status, ballastIssue }: { 
      fixtureId: string; 
      status: string; 
      ballastIssue: boolean;
    }) => {
      const { error } = await supabase
        .from('lighting_fixtures')
        .update({ 
          status,
          ballast_issue: ballastIssue,
          reported_out_date: status === 'non_functional' ? new Date().toISOString() : null
        })
        .eq('id', fixtureId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['room-fixtures', room.id] });
      queryClient.invalidateQueries({ queryKey: ['lighting-rooms'] });
      toast.success('Fixture status updated');
    },
    onError: (error) => {
      toast.error('Failed to update fixture');
      console.error(error);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'functional': return 'bg-green-50 text-green-700 border-green-200';
      case 'non_functional': return 'bg-red-50 text-red-700 border-red-200';
      case 'maintenance_needed': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const healthPercent = room.total_fixtures > 0
    ? Math.round((room.functional_count / room.total_fixtures) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Room Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <DoorOpen className="h-6 w-6 text-muted-foreground" />
                <div>
                  {room.room_number && (
                    <Badge variant="outline" className="font-mono mb-2">
                      Room {room.room_number}
                    </Badge>
                  )}
                  <CardTitle className="text-2xl">{room.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {room.building_name} • {room.floor_name}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{room.total_fixtures}</span>
              </div>
              <div className={`text-sm font-semibold ${
                healthPercent >= 90 ? 'text-green-600' :
                healthPercent >= 70 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {healthPercent}% Functional
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{room.functional_count}</div>
              <div className="text-sm text-muted-foreground">Functional</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{room.non_functional_count}</div>
              <div className="text-sm text-muted-foreground">Out</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{room.maintenance_count}</div>
              <div className="text-sm text-muted-foreground">Maintenance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fixtures List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Fixtures</h3>
        {fixtures.map((fixture) => (
          <Card key={fixture.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{fixture.name}</span>
                    {fixture.ballast_issue && (
                      <Badge variant="outline" className="gap-1">
                        <Zap className="h-3 w-3" />
                        Ballast
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {fixture.technology} • {fixture.bulb_count} bulb{fixture.bulb_count !== 1 ? 's' : ''}
                  </div>
                  {fixture.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{fixture.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(fixture.status)}>
                    {fixture.status.replace('_', ' ').toUpperCase()}
                  </Badge>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => updateStatusMutation.mutate({
                        fixtureId: fixture.id,
                        status: 'functional',
                        ballastIssue: false
                      })}
                      disabled={updateStatusMutation.isPending}
                      title="Mark as Functional"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => updateStatusMutation.mutate({
                        fixtureId: fixture.id,
                        status: 'non_functional',
                        ballastIssue: false
                      })}
                      disabled={updateStatusMutation.isPending}
                      title="Mark as Out"
                    >
                      <XCircle className="h-4 w-4 text-red-600" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => updateStatusMutation.mutate({
                        fixtureId: fixture.id,
                        status: 'maintenance_needed',
                        ballastIssue: true
                      })}
                      disabled={updateStatusMutation.isPending}
                      title="Mark as Ballast Issue"
                    >
                      <Zap className="h-4 w-4 text-yellow-600" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => updateStatusMutation.mutate({
                        fixtureId: fixture.id,
                        status: 'maintenance_needed',
                        ballastIssue: false
                      })}
                      disabled={updateStatusMutation.isPending}
                      title="Mark as Needs Maintenance"
                    >
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
