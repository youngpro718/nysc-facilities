import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LightingFixture } from "@/types/lighting";
import { formatDistanceToNow } from "date-fns";
import { Lightbulb, Zap, AlertTriangle, CheckCircle, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface SimpleLightingTableProps {
  fixtures: LightingFixture[];
  onRefresh: () => void;
}

export function SimpleLightingTable({ fixtures, onRefresh }: SimpleLightingTableProps) {
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'functional' | 'non_functional' | 'needs_electrician'>('all');

  const formatMinutes = (mins?: number | null) => {
    if (mins === null || mins === undefined) return null;
    const days = Math.floor(mins / (60 * 24));
    const hours = Math.floor((mins % (60 * 24)) / 60);
    const minutes = Math.floor(mins % 60);
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 && days === 0) parts.push(`${minutes}m`);
    return parts.join(" ") || '0m';
  };

  // Filter fixtures based on search and status
  const filteredFixtures = fixtures.filter(fixture => {
    const matchesSearch = fixture.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fixture.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         '';
    
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'functional' && fixture.status === 'functional') ||
                         (statusFilter === 'non_functional' && fixture.status === 'non_functional') ||
                         (statusFilter === 'needs_electrician' && fixture.requires_electrician);
    
    return matchesSearch && matchesStatus;
  });

  // Status counts for summary
  const statusCounts = {
    total: fixtures.length,
    out: fixtures.filter(f => f.status === 'non_functional').length,
    needsElectrician: fixtures.filter(f => f.requires_electrician).length,
    ballastIssues: fixtures.filter(f => f.ballast_issue).length
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFixtures(filteredFixtures.map(f => f.id));
    } else {
      setSelectedFixtures([]);
    }
  };

  const handleSelectFixture = (fixtureId: string, checked: boolean) => {
    if (checked) {
      setSelectedFixtures(prev => [...prev, fixtureId]);
    } else {
      setSelectedFixtures(prev => prev.filter(id => id !== fixtureId));
    }
  };

  const handleMarkOut = async (requiresElectrician: boolean = false) => {
    try {
      await markLightsOut(selectedFixtures, requiresElectrician);
      toast.success(`Marked ${selectedFixtures.length} lights as out`);
      setSelectedFixtures([]);
      onRefresh();
    } catch (error) {
      toast.error("Failed to update lights");
    }
  };

  const handleMarkFixed = async () => {
    try {
      await markLightsFixed(selectedFixtures);
      toast.success(`Marked ${selectedFixtures.length} lights as fixed`);
      setSelectedFixtures([]);
      onRefresh();
    } catch (error) {
      toast.error("Failed to update lights");
    }
  };

  const handleToggleElectrician = async (required: boolean) => {
    try {
      await toggleElectricianRequired(selectedFixtures, required);
      toast.success(`Updated electrician requirement for ${selectedFixtures.length} lights`);
      setSelectedFixtures([]);
      onRefresh();
    } catch (error) {
      toast.error("Failed to update electrician requirement");
    }
  };

  const getStatusBadge = (fixture: LightingFixture) => {
    if (fixture.status === 'functional') {
      return <Badge variant="default" className="gap-1 bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3" />Working</Badge>;
    }
    if (fixture.requires_electrician) {
      return <Badge variant="destructive" className="gap-1"><Zap className="h-3 w-3" />Needs Electrician</Badge>;
    }
    return <Badge variant="secondary" className="gap-1"><AlertTriangle className="h-3 w-3" />Out</Badge>;
  };

  const getTechnologyBadge = (technology: string | null, bulbCount: number) => {
    const tech = technology || 'Bulb';
    const color = technology === 'LED' ? 'default' : 
                 technology === 'Fluorescent' ? 'secondary' : 'outline';
    return <Badge variant={color}>{tech} ({bulbCount})</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{statusCounts.total}</p>
              <p className="text-sm text-muted-foreground">Total Lights</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-2xl font-bold text-destructive">{statusCounts.out}</p>
              <p className="text-sm text-muted-foreground">Lights Out</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-warning" />
            <div>
              <p className="text-2xl font-bold text-warning">{statusCounts.needsElectrician}</p>
              <p className="text-sm text-muted-foreground">Need Electrician</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-orange-500">{statusCounts.ballastIssues}</p>
              <p className="text-sm text-muted-foreground">Ballast Issues</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search lights or rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border rounded px-3 py-2 bg-background"
          >
            <option value="all">All Lights</option>
            <option value="functional">Working</option>
            <option value="non_functional">Out</option>
            <option value="needs_electrician">Needs Electrician</option>
          </select>
        </div>

        {selectedFixtures.length > 0 && (
          <div className="flex gap-2">
            <Button onClick={() => handleMarkOut(false)} variant="outline" size="sm">
              Mark Out
            </Button>
            <Button onClick={() => handleMarkOut(true)} variant="outline" size="sm">
              Out - Needs Electrician
            </Button>
            <Button onClick={handleMarkFixed} variant="default" size="sm">
              Mark Fixed
            </Button>
            <Button onClick={() => handleToggleElectrician(true)} variant="outline" size="sm">
              Flag for Electrician
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3">
                  <Checkbox
                    checked={selectedFixtures.length === filteredFixtures.length && filteredFixtures.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="text-left p-3 font-medium">Room</th>
                <th className="text-left p-3 font-medium">Light Name</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Ballast</th>
                <th className="text-left p-3 font-medium">Outage Age</th>
                <th className="text-left p-3 font-medium">Repair Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredFixtures.map((fixture) => (
                <tr key={fixture.id} className="border-b hover:bg-muted/30">
                  <td className="p-3">
                    <Checkbox
                      checked={selectedFixtures.includes(fixture.id)}
                      onCheckedChange={(checked) => handleSelectFixture(fixture.id, checked as boolean)}
                    />
                  </td>
                  <td className="p-3 font-medium">{fixture.room_number || 'No Room'}</td>
                  <td className="p-3">{fixture.name}</td>
                  <td className="p-3">
                    {getTechnologyBadge(fixture.technology, fixture.bulb_count)}
                  </td>
                  <td className="p-3">
                    {getStatusBadge(fixture)}
                  </td>
                  <td className="p-3">
                    {fixture.ballast_issue ? (
                      <Badge variant="destructive">Issue</Badge>
                    ) : (
                      <Badge variant="outline">OK</Badge>
                    )}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {fixture.outage_minutes != null
                      ? `Out for ${formatMinutes(fixture.outage_minutes)}`
                      : (fixture.reported_out_date
                          ? formatDistanceToNow(new Date(fixture.reported_out_date), { addSuffix: true })
                          : '-')}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {fixture.repair_minutes != null
                      ? formatMinutes(fixture.repair_minutes)
                      : (fixture.replaced_date
                          ? formatDistanceToNow(new Date(fixture.replaced_date), { addSuffix: true })
                          : '-')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredFixtures.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No lights found matching your criteria.
        </div>
      )}
    </div>
  );
}