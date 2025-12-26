import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Plus, Settings, Zap, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { EnhancedRoom } from "../../types/EnhancedRoomTypes";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface RoomLightingManagerProps {
  room: EnhancedRoom;
  trigger: React.ReactNode;
}

interface LightingFixture {
  id: string;
  name: string;
  location: string;
  bulbType: string;
  status: 'functional' | 'out' | 'flickering' | 'maintenance';
  ballastIssue: boolean;
  outageDate?: string;
}

export function RoomLightingManager({ room, trigger }: RoomLightingManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [totalBulbs, setTotalBulbs] = useState(room.total_fixtures_count || 4);
  const [defaultBulbType, setDefaultBulbType] = useState<string>('LED');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoadedFromDb, setHasLoadedFromDb] = useState(false);
  const { toast } = useToast();

  const [fixtures, setFixtures] = useState<LightingFixture[]>([]);

  // Reset loaded state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setHasLoadedFromDb(false);
    }
  }, [isOpen]);

  // Fetch real lighting fixtures from database - ONLY when dialog opens or room changes
  useEffect(() => {
    const fetchFixtures = async () => {
      try {
        const { data, error } = await supabase
          .from('lighting_fixtures')
          .select('*')
          .eq('space_id', room.id);

        if (error) throw error;

        if (data && data.length > 0) {
          // Convert database fixtures to our format
          const convertedFixtures: LightingFixture[] = data.map((fixture, index) => ({
            id: fixture.id,
            name: fixture.name || `Light ${index + 1}`,
            location: fixture.position || 'ceiling',
            bulbType: fixture.technology || 'LED',
            status: fixture.status === 'functional' ? 'functional' : 
                   fixture.status === 'non_functional' ? 'out' : 
                   fixture.status === 'maintenance_needed' ? 'maintenance' : 'functional',
            ballastIssue: fixture.ballast_issue || false,
            outageDate: fixture.reported_out_date || undefined
          }));
          setFixtures(convertedFixtures);
          setTotalBulbs(convertedFixtures.length);
        } else {
          // Create default fixtures if none exist
          const defaultFixtures: LightingFixture[] = [];
          const initialCount = 4;
          for (let i = 1; i <= initialCount; i++) {
            defaultFixtures.push({
              id: `temp-${i}`,
              name: `Light ${i}`,
              location: i <= 2 ? 'Ceiling Main' : 'Ceiling Corner',
              bulbType: 'LED',
              status: 'functional',
              ballastIssue: false
            });
          }
          setFixtures(defaultFixtures);
          setTotalBulbs(initialCount);
        }
        setHasLoadedFromDb(true);
      } catch (error) {
        console.error('Error fetching fixtures:', error);
        // Fallback to default fixtures
        const defaultFixtures: LightingFixture[] = [];
        for (let i = 1; i <= 4; i++) {
          defaultFixtures.push({
            id: `temp-${i}`,
            name: `Light ${i}`,
            location: 'Ceiling',
            bulbType: 'LED',
            status: 'functional',
            ballastIssue: false
          });
        }
        setFixtures(defaultFixtures);
        setTotalBulbs(4);
        setHasLoadedFromDb(true);
      }
    };

    // Only fetch when dialog opens AND we haven't loaded yet
    if (isOpen && room.id && !hasLoadedFromDb) {
      fetchFixtures();
    }
  }, [isOpen, room.id, hasLoadedFromDb]);

  // Handle total fixtures count change from input field only
  const handleTotalBulbsChange = (newTotal: number) => {
    const currentCount = fixtures.length;
    setTotalBulbs(newTotal);
    
    if (newTotal > currentCount) {
      // Add fixtures
      const newFixtures = [...fixtures];
      for (let i = currentCount + 1; i <= newTotal; i++) {
        newFixtures.push({
          id: `temp-${Date.now()}-${i}`,
          name: `Light ${i}`,
          location: 'Ceiling',
          bulbType: defaultBulbType,
          status: 'functional',
          ballastIssue: false
        });
      }
      setFixtures(newFixtures);
    } else if (newTotal < currentCount) {
      // Remove fixtures (keep existing ones, remove from end)
      setFixtures(prev => prev.slice(0, newTotal));
    }
  };

  const statusStats = useMemo(() => {
    const functional = fixtures.filter(f => f.status === 'functional').length;
    const out = fixtures.filter(f => f.status === 'out').length;
    const maintenance = fixtures.filter(f => f.status === 'maintenance' || f.ballastIssue).length;
    const flickering = fixtures.filter(f => f.status === 'flickering').length;
    
    return { functional, out, maintenance, flickering, total: fixtures.length };
  }, [fixtures]);

  const getStatusColor = (status: string, ballastIssue: boolean = false) => {
    if (ballastIssue) return 'bg-warning text-warning-foreground';
    
    switch (status) {
      case 'functional':
        return 'bg-success text-success-foreground';
      case 'out':
        return 'bg-destructive text-destructive-foreground';
      case 'flickering':
        return 'bg-warning text-warning-foreground';
      case 'maintenance':
        return 'bg-info text-info-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string, ballastIssue: boolean = false) => {
    if (ballastIssue) return <Zap className="h-3 w-3" />;
    
    switch (status) {
      case 'functional':
        return <CheckCircle className="h-3 w-3" />;
      case 'out':
        return <AlertTriangle className="h-3 w-3" />;
      case 'flickering':
        return <Clock className="h-3 w-3" />;
      case 'maintenance':
        return <Settings className="h-3 w-3" />;
      default:
        return <Lightbulb className="h-3 w-3" />;
    }
  };

  const toggleFixtureStatus = (fixtureId: string) => {
    setFixtures(prev => prev.map(fixture => {
      if (fixture.id === fixtureId) {
        const newStatus = fixture.status === 'functional' ? 'out' : 'functional';
        return {
          ...fixture,
          status: newStatus,
          outageDate: newStatus === 'out' ? new Date().toISOString() : undefined
        };
      }
      return fixture;
    }));
  };

  const toggleBallastIssue = (fixtureId: string) => {
    setFixtures(prev => prev.map(fixture => {
      if (fixture.id === fixtureId) {
        return {
          ...fixture,
          ballastIssue: !fixture.ballastIssue
        };
      }
      return fixture;
    }));
  };

  const handleSaveConfiguration = async () => {
    setIsSubmitting(true);
    try {
      // Save fixtures to database
      for (const fixture of fixtures) {
        if (fixture.id.startsWith('temp-')) {
          // Create new fixture
          const technologyValue = fixture.bulbType === 'Incandescent' || fixture.bulbType === 'Halogen' ? 'Bulb' : fixture.bulbType as 'LED' | 'Fluorescent' | 'Bulb';
          
          const { error } = await supabase
            .from('lighting_fixtures')
            .insert({
              name: fixture.name,
              room_number: room.room_number || null,
              space_id: room.id,
              space_type: 'room' as const,
              type: 'standard' as const,
              status: fixture.status === 'functional' ? 'functional' as const : 'non_functional' as const,
              position: fixture.location.toLowerCase().includes('ceiling') ? 'ceiling' as const : 'wall' as const,
              technology: technologyValue,
              bulb_count: 1,
              ballast_issue: fixture.ballastIssue,
              requires_electrician: fixture.ballastIssue,
              reported_out_date: fixture.outageDate || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (error) throw error;
        } else {
          // Update existing fixture
          const { error } = await supabase
            .from('lighting_fixtures')
            .update({
              status: fixture.status === 'functional' ? 'functional' as const : 'non_functional' as const,
              ballast_issue: fixture.ballastIssue,
              requires_electrician: fixture.ballastIssue,
              reported_out_date: fixture.outageDate || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', fixture.id);

          if (error) throw error;
        }
      }
      
      toast({
        title: "Configuration Saved",
        description: `Room lighting configured with ${fixtures.length} fixtures.`,
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving lighting configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save lighting configuration.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addFixture = () => {
    const newFixture: LightingFixture = {
      id: `temp-${Date.now()}`,
      name: `Light ${fixtures.length + 1}`,
      location: 'Ceiling',
      bulbType: defaultBulbType,
      status: 'functional',
      ballastIssue: false
    };
    setFixtures(prev => [...prev, newFixture]);
    setTotalBulbs(fixtures.length + 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Lighting Management - {room.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-success/10 rounded-lg border border-success/20">
              <div className="text-2xl font-bold text-success">{statusStats.functional}</div>
              <div className="text-xs text-success/80">Functional</div>
            </div>
            <div className="text-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="text-2xl font-bold text-destructive">{statusStats.out}</div>
              <div className="text-xs text-destructive/80">Out</div>
            </div>
            <div className="text-center p-3 bg-warning/10 rounded-lg border border-warning/20">
              <div className="text-2xl font-bold text-warning">{statusStats.maintenance}</div>
              <div className="text-xs text-warning/80">Issues</div>
            </div>
            <div className="text-center p-3 bg-info/10 rounded-lg border border-info/20">
              <div className="text-2xl font-bold text-info">{statusStats.total}</div>
              <div className="text-xs text-info/80">Total</div>
            </div>
          </div>

          {/* Room Configuration */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-semibold text-sm">Room Configuration</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalBulbs" className="text-sm">Total Fixtures</Label>
                <Input
                  id="totalBulbs"
                  type="number"
                  value={totalBulbs}
                  onChange={(e) => handleTotalBulbsChange(parseInt(e.target.value) || 0)}
                  min="1"
                  max="20"
                />
              </div>
              <div>
                <Label htmlFor="bulbType" className="text-sm">Default Bulb Type</Label>
                <Select value={defaultBulbType} onValueChange={setDefaultBulbType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LED">LED</SelectItem>
                    <SelectItem value="Fluorescent">Fluorescent</SelectItem>
                    <SelectItem value="Incandescent">Incandescent</SelectItem>
                    <SelectItem value="Halogen">Halogen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Fixture Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Fixture Status</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={addFixture}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Fixture
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fixtures.map((fixture) => (
                <div 
                  key={fixture.id}
                  className="p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${getStatusColor(fixture.status, fixture.ballastIssue)}`}>
                        {getStatusIcon(fixture.status, fixture.ballastIssue)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{fixture.name}</div>
                        <div className="text-xs text-muted-foreground">{fixture.location}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {fixture.bulbType}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={fixture.status === 'functional' ? 'destructive' : 'default'}
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => toggleFixtureStatus(fixture.id)}
                    >
                      {fixture.status === 'functional' ? 'Mark Out' : 'Mark Fixed'}
                    </Button>
                    <Button
                      variant={fixture.ballastIssue ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => toggleBallastIssue(fixture.id)}
                    >
                      {fixture.ballastIssue ? 'Fix Ballast' : 'Ballast Issue'}
                    </Button>
                  </div>
                  
                  {fixture.outageDate && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Out since {new Date(fixture.outageDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSaveConfiguration}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : 'Save Configuration'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}