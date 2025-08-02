import React, { useState, useMemo } from 'react';
import { Search, Filter, X, MapPin, Home, DoorOpen, Navigation, Zap, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FloorPlanNode } from '../types/floorPlanTypes';

interface AdvancedSearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  objects: FloorPlanNode[];
  onObjectSelect: (objectId: string) => void;
  onHighlightObjects: (objectIds: string[]) => void;
}

interface SearchFilters {
  query: string;
  type: string;
  status: string;
  roomType: string;
  hasLighting: boolean;
  hasIssues: boolean;
}

export function AdvancedSearchPanel({
  isOpen,
  onClose,
  objects,
  onObjectSelect,
  onHighlightObjects
}: AdvancedSearchPanelProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: 'all',
    status: 'all',
    roomType: 'all',
    hasLighting: false,
    hasIssues: false
  });

  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const types = new Set<string>();
    const statuses = new Set<string>();
    const roomTypes = new Set<string>();

    // Add safety check for objects array
    if (!objects || !Array.isArray(objects)) {
      return {
        types: [],
        statuses: [],
        roomTypes: []
      };
    }

    objects.forEach(obj => {
      if (!obj) return; // Safety check for null/undefined objects
      if (obj.type) types.add(obj.type);
      if (obj.data?.properties?.status) statuses.add(obj.data.properties.status);
      if (obj.data?.properties?.room_type) roomTypes.add(obj.data.properties.room_type);
    });

    return {
      types: Array.from(types),
      statuses: Array.from(statuses),
      roomTypes: Array.from(roomTypes)
    };
  }, [objects]);

  // Filter objects based on current filters
  const filteredObjects = useMemo(() => {
    return objects.filter(obj => {
      // Text search
      if (filters.query) {
        const searchText = filters.query.toLowerCase();
        const matchesName = obj.data?.label?.toLowerCase().includes(searchText);
        const matchesType = obj.type?.toLowerCase().includes(searchText);
        const matchesRoomNumber = obj.data?.properties?.room_number?.toLowerCase().includes(searchText);
        
        if (!matchesName && !matchesType && !matchesRoomNumber) {
          return false;
        }
      }

      // Type filter
      if (filters.type !== 'all' && obj.type !== filters.type) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && obj.data?.properties?.status !== filters.status) {
        return false;
      }

      // Room type filter
      if (filters.roomType !== 'all' && obj.data?.properties?.room_type !== filters.roomType) {
        return false;
      }

      // Lighting filter
      if (filters.hasLighting && !obj.data?.properties?.lighting_status) {
        return false;
      }

      // Issues filter
      if (filters.hasIssues && obj.data?.properties?.status === 'active') {
        return false;
      }

      return true;
    });
  }, [objects, filters]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleObjectToggle = (objectId: string) => {
    setSelectedObjects(prev => {
      const newSelection = prev.includes(objectId)
        ? prev.filter(id => id !== objectId)
        : [...prev, objectId];
      
      onHighlightObjects(newSelection);
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    const allIds = filteredObjects.map(obj => obj.id);
    setSelectedObjects(allIds);
    onHighlightObjects(allIds);
  };

  const handleClearSelection = () => {
    setSelectedObjects([]);
    onHighlightObjects([]);
  };

  const getObjectIcon = (type: string) => {
    switch (type) {
      case 'room': return <Home className="h-4 w-4" />;
      case 'door': return <DoorOpen className="h-4 w-4" />;
      case 'hallway': return <Navigation className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-slate-900 shadow-2xl">
        <Card className="h-full rounded-none border-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Advanced Search
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Find and filter floor plan objects
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="p-6 space-y-4 border-b border-slate-200 dark:border-slate-700">
            {/* Text Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, type, or room number..."
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                  Type
                </label>
                <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {filterOptions.types.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                  Status
                </label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {filterOptions.statuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasLighting"
                  checked={filters.hasLighting}
                  onCheckedChange={(checked) => handleFilterChange('hasLighting', checked)}
                />
                <label htmlFor="hasLighting" className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Has lighting data
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasIssues"
                  checked={filters.hasIssues}
                  onCheckedChange={(checked) => handleFilterChange('hasIssues', checked)}
                />
                <label htmlFor="hasIssues" className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Has issues
                </label>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {filteredObjects.length} results found
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearSelection}>
                  Clear
                </Button>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {filteredObjects.map(obj => (
                <div
                  key={obj.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    selectedObjects.includes(obj.id)
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                  }`}
                  onClick={() => handleObjectToggle(obj.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded">
                        {getObjectIcon(obj.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {obj.data?.label || `${obj.type} ${obj.id.slice(0, 8)}`}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {obj.type} • Position: ({Math.round(obj.position.x)}, {Math.round(obj.position.y)})
                        </p>
                        {obj.data?.properties?.room_number && (
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            Room: {obj.data.properties.room_number}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {obj.data?.properties?.status && (
                        <Badge className={`text-xs ${getStatusColor(obj.data.properties.status)}`}>
                          {obj.data.properties.status}
                        </Badge>
                      )}
                      {obj.data?.properties?.lighting_status && (
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-slate-500">Lighting</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onObjectSelect(obj.id);
                      }}
                      className="h-6 text-xs"
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Focus camera on object
                      }}
                      className="h-6 text-xs"
                    >
                      Focus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
