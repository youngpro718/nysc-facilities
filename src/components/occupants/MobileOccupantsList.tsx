import { useState, useCallback } from "react";
import { EnhancedMobileOccupantCard } from "./EnhancedMobileOccupantCard";
import { MobileOccupantFilters } from "./MobileOccupantFilters";
import { MobileDetailsDialog } from "@/components/mobile/MobileDetailsDialog";
import { MobileActionSheet } from "@/components/mobile/MobileActionSheet";
import { MobileSearchBar } from "@/components/mobile/MobileSearchBar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Filter, Users, Mail, Phone, MapPin, Calendar, Building, Key, DoorOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MobileOccupantsListProps {
  occupants: any[];
  isLoading: boolean;
  onCreateOccupant?: () => void;
  onEditOccupant?: (occupant: any) => void;
  onDeleteOccupant?: (id: string) => void;
  onAssignRooms?: () => void;
  onAssignKeys?: () => void;
  selectedOccupants?: string[];
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
}

export function MobileOccupantsList({ 
  occupants,
  isLoading,
  onCreateOccupant,
  onEditOccupant,
  onDeleteOccupant,
  onAssignRooms,
  onAssignKeys,
  selectedOccupants = [],
  onToggleSelect,
  onSelectAll
}: MobileOccupantsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    department: 'all',
    status: 'all',
    sortBy: 'name',
    order: 'asc' as const
  });
  const [selectedOccupant, setSelectedOccupant] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Filter and search logic
  const filteredOccupants = occupants.filter(occupant => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const fullName = `${occupant.first_name} ${occupant.last_name}`.toLowerCase();
      if (!fullName.includes(query) && 
          !occupant.email?.toLowerCase().includes(query) &&
          !occupant.department?.toLowerCase().includes(query) &&
          !occupant.job_title?.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Department filter
    if (filters.department !== 'all' && occupant.department !== filters.department) {
      return false;
    }

    // Status filter
    if (filters.status !== 'all' && occupant.status !== filters.status) {
      return false;
    }

    return true;
  });

  // Sort logic
  const sortedOccupants = [...filteredOccupants].sort((a, b) => {
    const { sortBy, order } = filters;
    
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = `${a.first_name} ${a.last_name}`;
        bValue = `${b.first_name} ${b.last_name}`;
        break;
      case 'department':
        aValue = a.department || '';
        bValue = b.department || '';
        break;
      case 'created_at':
        aValue = a.created_at;
        bValue = b.created_at;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        aValue = a[sortBy] || '';
        bValue = b[sortBy] || '';
    }
    
    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const handleOccupantClick = useCallback((occupant: any) => {
    setSelectedOccupant(occupant);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedOccupant(null);
  }, []);

  const handleFiltersChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.department !== 'all') count++;
    if (filters.status !== 'all') count++;
    return count;
  };

  const clearAllFilters = () => {
    setFilters({
      department: 'all',
      status: 'all',
      sortBy: 'name',
      order: 'asc'
    });
  };

  // Quick filter actions
  const handleActiveOnly = () => {
    setFilters(f => ({ ...f, status: 'active' }));
  };

  const handleAdministration = () => {
    setFilters(f => ({ ...f, department: 'Administration' }));
  };

  const actions = [
    { 
      id: "create", 
      label: "Create New Occupant", 
      onClick: onCreateOccupant || (() => {}),
      icon: <Plus className="h-4 w-4" />
    },
    { 
      id: "assign_rooms", 
      label: "Assign Rooms", 
      onClick: onAssignRooms || (() => {}),
      icon: <DoorOpen className="h-4 w-4" />,
      disabled: selectedOccupants.length === 0
    },
    { 
      id: "assign_keys", 
      label: "Assign Keys", 
      onClick: onAssignKeys || (() => {}),
      icon: <Key className="h-4 w-4" />,
      disabled: selectedOccupants.length === 0
    }
  ];

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'on_leave': return 'bg-yellow-500';
      case 'terminated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-none p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Occupants</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(true)}
              className="relative"
            >
              <Filter className="h-4 w-4" />
              {getActiveFilterCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getActiveFilterCount()}
                </span>
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => setShowActions(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <MobileSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search occupants..."
        />

        {/* Quick filter buttons */}
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleActiveOnly}
            className={filters.status === 'active' ? 'bg-primary text-primary-foreground' : ''}
          >
            Active Only
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdministration}
            className={filters.department === 'Administration' ? 'bg-primary text-primary-foreground' : ''}
          >
            Administration
          </Button>
          {getActiveFilterCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Selection info */}
        {selectedOccupants.length > 0 && (
          <div className="mt-3 p-2 bg-primary/10 rounded-md flex items-center justify-between">
            <span className="text-sm text-primary">
              {selectedOccupants.length} selected
            </span>
            <Button variant="ghost" size="sm" onClick={onSelectAll}>
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Occupants List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {sortedOccupants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No occupants match your search criteria" : "No occupants have been added yet"}
              </p>
              {onCreateOccupant && (
                <Button onClick={onCreateOccupant}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Occupant
                </Button>
              )}
            </div>
          ) : (
            sortedOccupants.map((occupant) => (
              <EnhancedMobileOccupantCard
                key={occupant.id}
                occupant={occupant}
                onClick={() => handleOccupantClick(occupant)}
                onEdit={() => onEditOccupant?.(occupant)}
                onDelete={() => onDeleteOccupant?.(occupant.id)}
                onAssignRooms={onAssignRooms}
                onAssignKeys={onAssignKeys}
                isSelected={selectedOccupants.includes(occupant.id)}
                onToggleSelect={() => onToggleSelect?.(occupant.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Mobile Filters Sheet */}
      {showFilters && (
        <MobileOccupantFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
      )}

      {/* Occupant Details Dialog */}
      {selectedOccupant && (
        <MobileDetailsDialog
          open={!!selectedOccupant}
          onOpenChange={(open) => !open && handleCloseDetails()}
          title={`${selectedOccupant.first_name} ${selectedOccupant.last_name}`}
        >
          <div className="space-y-6">
            {/* Profile Section */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedOccupant.profile_picture} />
                  <AvatarFallback className="text-lg">
                    {getInitials(selectedOccupant.first_name, selectedOccupant.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div 
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background ${getStatusColor(selectedOccupant.status)}`}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedOccupant.first_name} {selectedOccupant.last_name}
                </h3>
                <p className="text-muted-foreground">{selectedOccupant.job_title}</p>
                <Badge variant="outline" className="mt-1">
                  {selectedOccupant.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Contact Information</h4>
              <div className="space-y-3">
                {selectedOccupant.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedOccupant.email}</span>
                  </div>
                )}
                {selectedOccupant.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedOccupant.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Work Information */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Work Information</h4>
              <div className="space-y-3">
                {selectedOccupant.department && (
                  <div className="flex items-center space-x-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedOccupant.department}</span>
                  </div>
                )}
                {selectedOccupant.current_room && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Room: {selectedOccupant.current_room}</span>
                  </div>
                )}
                {selectedOccupant.start_date && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Started: {new Date(selectedOccupant.start_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Room Assignments */}
            {selectedOccupant.rooms && selectedOccupant.rooms.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-3">Room Assignments</h4>
                <div className="space-y-2">
                  {selectedOccupant.rooms.map((room: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-muted/30 rounded-md">
                      <DoorOpen className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {room.room_number || room.name}
                          </span>
                          {index === 0 && (
                            <Badge variant="secondary" className="text-xs">Primary</Badge>
                          )}
                        </div>
                        {room.floors?.buildings?.name && (
                          <div className="text-xs text-muted-foreground">
                            {room.floors.buildings.name}
                            {room.floors?.name && ` - ${room.floors.name}`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Information */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Access Information</h4>
              <div className="flex items-center space-x-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {selectedOccupant.key_count || 0} {selectedOccupant.key_count === 1 ? 'key' : 'keys'} assigned
                </span>
              </div>
            </div>

            {/* Additional Details */}
            {selectedOccupant.notes && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground">{selectedOccupant.notes}</p>
              </div>
            )}
          </div>
        </MobileDetailsDialog>
      )}

      {/* Action Sheet */}
      {showActions && (
        <MobileActionSheet
          trigger={<div />}
          open={showActions}
          onOpenChange={setShowActions}
          title="Occupant Actions"
          actions={actions}
        />
      )}
    </div>
  );
}