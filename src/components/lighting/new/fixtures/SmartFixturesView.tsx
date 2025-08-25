import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useLightingFixtures } from "@/hooks/useLightingFixtures";
import { LightingFixture } from "@/types/lighting";
import { 
  LayoutGrid, 
  List, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
  MapPin,
  Zap,
  AlertTriangle,
  CheckCircle,
  Calendar
} from "lucide-react";

type ViewMode = 'cards' | 'table' | 'rooms';
type FilterType = 'all' | 'needs-attention' | 'functional' | 'maintenance' | 'emergency';

export function SmartFixturesView() {
  const { fixtures, isLoading, handleBulkStatusUpdate, handleBulkDelete } = useLightingFixtures();
  const [viewMode, setViewMode] = useState<ViewMode>('rooms');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');

  // Smart filters
  const filteredFixtures = useMemo(() => {
    if (!fixtures) return [];
    
    let filtered = fixtures;
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        f.name?.toLowerCase().includes(query) ||
        f.space_name?.toLowerCase().includes(query) ||
        f.room_number?.toLowerCase().includes(query)
      );
    }
    
    // Apply smart filters
    switch (filterType) {
      case 'needs-attention':
        filtered = filtered.filter(f => 
          f.status === 'non_functional' || 
          f.requires_electrician ||
          f.ballast_issue
        );
        break;
      case 'functional':
        filtered = filtered.filter(f => f.status === 'functional');
        break;
      case 'maintenance':
        filtered = filtered.filter(f => f.status === 'maintenance_needed');
        break;
      case 'emergency':
        filtered = filtered.filter(f => f.type === 'emergency');
        break;
    }
    
    return filtered;
  }, [fixtures, searchQuery, filterType]);

  // Group by room for room view
  const fixturesByRoom = useMemo(() => {
    const grouped = new Map<string, LightingFixture[]>();
    
    filteredFixtures.forEach(fixture => {
      const roomKey = `${fixture.space_name || 'Unknown'}-${fixture.room_number || ''}`;
      if (!grouped.has(roomKey)) {
        grouped.set(roomKey, []);
      }
      grouped.get(roomKey)!.push(fixture);
    });
    
    return Array.from(grouped.entries()).map(([roomName, fixtures]) => ({
      roomName,
      fixtures,
      totalFixtures: fixtures.length,
      functionalFixtures: fixtures.filter(f => f.status === 'functional').length,
      issuesCount: fixtures.filter(f => 
        f.status === 'non_functional' || f.requires_electrician || f.ballast_issue
      ).length,
      buildingName: fixtures[0]?.building_name || 'Unknown',
      floorName: fixtures[0]?.floor_name || 'Unknown'
    }));
  }, [filteredFixtures]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'functional': return 'bg-green-100 text-green-800';
      case 'non_functional': return 'bg-red-100 text-red-800';
      case 'maintenance_needed': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled_replacement': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (fixture: LightingFixture) => {
    if (fixture.requires_electrician) return <Zap className="h-4 w-4 text-orange-500" />;
    if (fixture.status === 'functional') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (fixture.status === 'non_functional') return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return <Calendar className="h-4 w-4 text-yellow-500" />;
  };

  const handleBulkAction = async (action: string) => {
    if (selectedFixtures.length === 0) return;
    
    try {
      switch (action) {
        case 'mark-functional':
          await handleBulkStatusUpdate(selectedFixtures, 'functional');
          break;
        case 'mark-maintenance':
          await handleBulkStatusUpdate(selectedFixtures, 'maintenance_needed');
          break;
        case 'delete':
          await handleBulkDelete(selectedFixtures);
          break;
      }
      setSelectedFixtures([]);
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-muted animate-pulse rounded-md"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fixtures by name, room, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Smart Filters */}
            <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fixtures</SelectItem>
                <SelectItem value="needs-attention">⚠️ Needs Attention</SelectItem>
                <SelectItem value="functional">✅ Functional</SelectItem>
                <SelectItem value="maintenance">🔧 Maintenance</SelectItem>
                <SelectItem value="emergency">🚨 Emergency</SelectItem>
              </SelectContent>
            </Select>
            
            {/* View Mode */}
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'rooms' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('rooms')}
              >
                <MapPin className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Bulk Actions */}
          {selectedFixtures.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-md flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedFixtures.length} fixtures selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleBulkAction('mark-functional')}>
                  Mark Functional
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('mark-maintenance')}>
                  Schedule Maintenance
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                  Delete
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content based on view mode */}
      {viewMode === 'rooms' && (
        <div className="space-y-4">
          {fixturesByRoom.map((room, index) => {
            const healthPercentage = room.totalFixtures > 0 
              ? Math.round((room.functionalFixtures / room.totalFixtures) * 100) 
              : 0;
            
            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{room.roomName}</CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {room.buildingName} • {room.floorName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{healthPercentage}%</div>
                      <div className="text-xs text-muted-foreground">Health Score</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {room.fixtures.map((fixture) => (
                      <div
                        key={fixture.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Checkbox
                            checked={selectedFixtures.includes(fixture.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedFixtures(prev => [...prev, fixture.id]);
                              } else {
                                setSelectedFixtures(prev => prev.filter(id => id !== fixture.id));
                              }
                            }}
                          />
                          {getStatusIcon(fixture)}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{fixture.name}</div>
                          <div className="text-xs text-muted-foreground">{fixture.position}</div>
                          <Badge className={`text-xs ${getStatusColor(fixture.status)}`}>
                            {fixture.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        {fixture.requires_electrician && (
                          <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Electrician Required
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {room.issuesCount > 0 && (
                    <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200">
                      <div className="text-sm text-red-800">
                        ⚠️ {room.issuesCount} fixture{room.issuesCount !== 1 ? 's' : ''} need{room.issuesCount === 1 ? 's' : ''} attention
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFixtures.map((fixture) => (
            <Card key={fixture.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Checkbox
                    checked={selectedFixtures.includes(fixture.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFixtures(prev => [...prev, fixture.id]);
                      } else {
                        setSelectedFixtures(prev => prev.filter(id => id !== fixture.id));
                      }
                    }}
                  />
                  {getStatusIcon(fixture)}
                </div>
                
                <div className="space-y-2">
                  <div className="font-medium">{fixture.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {fixture.space_name} • {fixture.room_number}
                  </div>
                  <Badge className={`text-xs ${getStatusColor(fixture.status)}`}>
                    {fixture.status.replace('_', ' ')}
                  </Badge>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{fixture.technology}</span>
                    <span>{fixture.position}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}