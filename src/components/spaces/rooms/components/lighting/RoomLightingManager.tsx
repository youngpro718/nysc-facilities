import React, { useState, useMemo, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Plus, Zap, AlertTriangle, CheckCircle, Clock, Trash2, Loader2 } from "lucide-react";
import { EnhancedRoom } from "../../types/EnhancedRoomTypes";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

interface RoomLightingManagerProps {
  room: EnhancedRoom;
  trigger: React.ReactNode;
}

// DB enum values
type DbStatus = 'functional' | 'non_functional' | 'maintenance_needed' | 'pending_maintenance' | 'scheduled_replacement';
type DbPosition = 'ceiling' | 'wall' | 'floor' | 'desk' | 'recessed';
type DbTechnology = 'LED' | 'Fluorescent' | 'Bulb';
type DbFixtureType = 'standard' | 'emergency' | 'motion_sensor';

interface LightingFixture {
  id: string;
  name: string;
  position: DbPosition;
  technology: DbTechnology;
  fixtureType: DbFixtureType;
  status: 'functional' | 'out' | 'maintenance';
  ballastIssue: boolean;
  outageDate?: string;
}

// DB check constraint: name must match 'Room {number} - {position} Light {N}'
function generateFixtureName(roomNumber: string, position: DbPosition, index: number): string {
  return `Room ${roomNumber || '0'} - ${position} Light ${index}`;
}

export function RoomLightingManager({ room, trigger }: RoomLightingManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedFromDb, setHasLoadedFromDb] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [fixtures, setFixtures] = useState<LightingFixture[]>([]);

  // Reset loaded state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setHasLoadedFromDb(false);
    }
  }, [isOpen]);

  // Fetch real lighting fixtures from database
  useEffect(() => {
    const fetchFixtures = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('lighting_fixtures')
          .select('*')
          .eq('space_id', room.id)
          .order('name', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const convertedFixtures: LightingFixture[] = data.map((fixture, index) => ({
            id: fixture.id,
            name: fixture.name || `Light ${index + 1}`,
            position: (fixture.position as DbPosition) || 'ceiling',
            technology: (fixture.technology as DbTechnology) || 'LED',
            fixtureType: (fixture.type as DbFixtureType) || 'standard',
            status: fixture.status === 'functional' ? 'functional' : 
                   fixture.status === 'maintenance_needed' ? 'maintenance' : 'out',
            ballastIssue: fixture.ballast_issue || false,
            outageDate: fixture.reported_out_date || undefined
          }));
          setFixtures(convertedFixtures);
        } else {
          setFixtures([]);
        }
        setHasLoadedFromDb(true);
      } catch (error) {
        logger.error('Error fetching fixtures:', error);
        setFixtures([]);
        setHasLoadedFromDb(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && room.id && !hasLoadedFromDb) {
      fetchFixtures();
    }
  }, [isOpen, room.id, hasLoadedFromDb]);

  const statusStats = useMemo(() => {
    const functional = fixtures.filter(f => f.status === 'functional').length;
    const out = fixtures.filter(f => f.status === 'out').length;
    const maintenance = fixtures.filter(f => f.status === 'maintenance' || f.ballastIssue).length;
    return { functional, out, maintenance, total: fixtures.length };
  }, [fixtures]);

  const getStatusColor = (status: string, ballastIssue: boolean = false) => {
    if (ballastIssue) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    switch (status) {
      case 'functional': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'out': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'maintenance': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string, ballastIssue: boolean = false) => {
    if (ballastIssue) return <Zap className="h-3 w-3" />;
    switch (status) {
      case 'functional': return <CheckCircle className="h-3 w-3" />;
      case 'out': return <AlertTriangle className="h-3 w-3" />;
      case 'maintenance': return <Clock className="h-3 w-3" />;
      default: return <Lightbulb className="h-3 w-3" />;
    }
  };

  const toDbStatus = (status: string): DbStatus => {
    switch (status) {
      case 'functional': return 'functional';
      case 'maintenance': return 'maintenance_needed';
      default: return 'non_functional';
    }
  };

  const toggleFixtureStatus = (fixtureId: string) => {
    setFixtures(prev => prev.map(fixture => {
      if (fixture.id === fixtureId) {
        const newStatus = fixture.status === 'functional' ? 'out' : 'functional';
        return {
          ...fixture,
          status: newStatus as 'functional' | 'out' | 'maintenance',
          outageDate: newStatus === 'out' ? new Date().toISOString() : undefined
        };
      }
      return fixture;
    }));
  };

  const toggleBallastIssue = (fixtureId: string) => {
    setFixtures(prev => prev.map(fixture => {
      if (fixture.id === fixtureId) {
        return { ...fixture, ballastIssue: !fixture.ballastIssue };
      }
      return fixture;
    }));
  };

  const removeFixture = (fixtureId: string) => {
    setFixtures(prev => renumberFixtures(prev.filter(f => f.id !== fixtureId)));
  };

  const handleSaveConfiguration = async () => {
    setIsSubmitting(true);
    let savedCount = 0;
    let errorMsg = '';
    
    try {
      // Determine which existing DB fixtures were removed
      const currentDbIds = fixtures.filter(f => !f.id.startsWith('temp-')).map(f => f.id);
      
      // Delete removed fixtures
      if (hasLoadedFromDb) {
        const { data: existingFixtures } = await supabase
          .from('lighting_fixtures')
          .select('id')
          .eq('space_id', room.id);
        
        const existingIds = (existingFixtures || []).map(f => f.id);
        const toDelete = existingIds.filter(id => !currentDbIds.includes(id));
        
        if (toDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('lighting_fixtures')
            .delete()
            .in('id', toDelete);
          if (deleteError) {
            logger.error('Error deleting fixtures:', deleteError);
          }
        }
      }

      // Save each fixture
      for (const fixture of fixtures) {
        if (fixture.id.startsWith('temp-')) {
          // INSERT new fixture — use .select() to detect RLS silent blocks
          const { data: inserted, error } = await supabase
            .from('lighting_fixtures')
            .insert({
              name: fixture.name,
              room_number: room.room_number || null,
              room_id: room.id,
              floor_id: room.floor_id || null,
              space_id: room.id,
              space_type: 'room',
              type: fixture.fixtureType,
              status: toDbStatus(fixture.status),
              position: fixture.position,
              technology: fixture.technology,
              bulb_count: 1,
              ballast_issue: fixture.ballastIssue,
              requires_electrician: fixture.ballastIssue,
              reported_out_date: fixture.outageDate || null,
              electrical_issues: { short_circuit: false, wiring_issues: false, voltage_problems: false },
            })
            .select('id');

          if (error) {
            errorMsg = error.message;
            logger.error('Error inserting fixture:', error);
            throw error;
          }
          if (!inserted || inserted.length === 0) {
            errorMsg = 'Permission denied. Your role may not have write access to lighting fixtures.';
            throw new Error(errorMsg);
          }
          savedCount++;
        } else {
          // UPDATE existing fixture
          const { data: updated, error } = await supabase
            .from('lighting_fixtures')
            .update({
              name: fixture.name,
              status: toDbStatus(fixture.status),
              position: fixture.position,
              technology: fixture.technology,
              type: fixture.fixtureType,
              ballast_issue: fixture.ballastIssue,
              requires_electrician: fixture.ballastIssue,
              reported_out_date: fixture.outageDate || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', fixture.id)
            .select('id');

          if (error) {
            errorMsg = error.message;
            logger.error('Error updating fixture:', error);
            throw error;
          }
          if (!updated || updated.length === 0) {
            errorMsg = 'Permission denied. Your role may not have write access to lighting fixtures.';
            throw new Error(errorMsg);
          }
          savedCount++;
        }
      }
      
      // Invalidate queries so the UI updates
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['lighting-with-tickets', room.id] });
      
      toast({
        title: "Lighting Saved",
        description: `${savedCount} fixture${savedCount !== 1 ? 's' : ''} saved successfully.`,
      });
      
      setIsOpen(false);
    } catch (error) {
      logger.error('Error saving lighting configuration:', error);
      toast({
        title: "Save Failed",
        description: errorMsg || "Failed to save lighting configuration. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addFixture = () => {
    const nextIndex = fixtures.length + 1;
    const newFixture: LightingFixture = {
      id: `temp-${Date.now()}`,
      name: generateFixtureName(room.room_number, 'ceiling', nextIndex),
      position: 'ceiling',
      technology: 'LED',
      fixtureType: 'standard',
      status: 'functional',
      ballastIssue: false
    };
    setFixtures(prev => [...prev, newFixture]);
  };

  const updateFixturePosition = (id: string, position: DbPosition) => {
    setFixtures(prev => {
      const updated = prev.map(f => f.id === id ? { ...f, position } : f);
      // Regenerate all names to keep numbering consistent per position
      return renumberFixtures(updated);
    });
  };

  const updateFixtureTechnology = (id: string, technology: DbTechnology) => {
    setFixtures(prev => prev.map(f => f.id === id ? { ...f, technology } : f));
  };

  // Regenerate names to satisfy DB constraint after any position change or removal
  const renumberFixtures = (list: LightingFixture[]): LightingFixture[] => {
    const counters: Record<string, number> = {};
    return list.map(f => {
      counters[f.position] = (counters[f.position] || 0) + 1;
      return { ...f, name: generateFixtureName(room.room_number, f.position, counters[f.position]) };
    });
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
            Lighting — {room.name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading fixtures…</span>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Status Overview */}
            {fixtures.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2.5 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">{statusStats.functional}</div>
                  <div className="text-xs text-muted-foreground">Working</div>
                </div>
                <div className="text-center p-2.5 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">{statusStats.out}</div>
                  <div className="text-xs text-muted-foreground">Out</div>
                </div>
                <div className="text-center p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{statusStats.maintenance}</div>
                  <div className="text-xs text-muted-foreground">Issues</div>
                </div>
                <div className="text-center p-2.5 bg-muted/30 rounded-lg border border-border">
                  <div className="text-xl font-bold text-foreground">{statusStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            )}

            {/* Fixture List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Fixtures</h4>
                <Button variant="outline" size="sm" onClick={addFixture}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Fixture
                </Button>
              </div>
              
              {fixtures.length === 0 && (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground mb-3">No fixtures yet</p>
                  <Button variant="outline" size="sm" onClick={addFixture}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add First Fixture
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {fixtures.map((fixture) => (
                  <div 
                    key={fixture.id}
                    className="p-3 border rounded-lg bg-card"
                  >
                    {/* Row 1: Name + Status indicator + Delete */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className={`p-1 rounded shrink-0 ${getStatusColor(fixture.status, fixture.ballastIssue)}`}>
                        {getStatusIcon(fixture.status, fixture.ballastIssue)}
                      </div>
                      <span className="text-sm font-medium truncate flex-1">{fixture.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFixture(fixture.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Row 2: Position + Technology selects */}
                    <div className="grid grid-cols-2 gap-2 mb-2.5">
                      <Select value={fixture.position} onValueChange={(v) => updateFixturePosition(fixture.id, v as DbPosition)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ceiling">Ceiling</SelectItem>
                          <SelectItem value="wall">Wall</SelectItem>
                          <SelectItem value="floor">Floor</SelectItem>
                          <SelectItem value="desk">Desk</SelectItem>
                          <SelectItem value="recessed">Recessed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={fixture.technology} onValueChange={(v) => updateFixtureTechnology(fixture.id, v as DbTechnology)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LED">LED</SelectItem>
                          <SelectItem value="Fluorescent">Fluorescent</SelectItem>
                          <SelectItem value="Bulb">Bulb</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Row 3: Action buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant={fixture.status === 'functional' ? 'destructive' : 'default'}
                        size="sm"
                        className="flex-1 text-xs h-7"
                        onClick={() => toggleFixtureStatus(fixture.id)}
                      >
                        {fixture.status === 'functional' ? 'Mark Out' : 'Mark Working'}
                      </Button>
                      <Button
                        variant={fixture.ballastIssue ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 text-xs h-7"
                        onClick={() => toggleBallastIssue(fixture.id)}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        {fixture.ballastIssue ? 'Clear Ballast' : 'Ballast Issue'}
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
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  `Save ${fixtures.length} Fixture${fixtures.length !== 1 ? 's' : ''}`
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}