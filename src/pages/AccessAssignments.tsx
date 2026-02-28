import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { usePersonnelAccess } from "@/hooks/usePersonnelAccess";
import { RoleBasedRoute } from "@/components/layout/RoleBasedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, UserCheck, Key, DoorOpen, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PersonnelAccessRecord } from "@/hooks/usePersonnelAccess";
import { PersonnelQuickAssignDialog } from "@/components/access-assignments/PersonnelQuickAssignDialog";

interface PersonnelCardProps {
  person: PersonnelAccessRecord;
  onClick?: () => void;
}

function PersonnelCard({ person, onClick }: PersonnelCardProps) {
  const initials = person.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            {person.avatar_url && <AvatarImage src={person.avatar_url} alt={person.name} />}
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-sm truncate">{person.name}</h3>
              <Badge 
                variant={person.is_registered_user ? "default" : "secondary"}
                className="text-xs shrink-0"
              >
                {person.is_registered_user ? "User" : "Personnel"}
              </Badge>
            </div>
            
            {person.title && (
              <p className="text-xs text-muted-foreground truncate">{person.title}</p>
            )}
            
            {person.department && (
              <p className="text-xs text-muted-foreground truncate">{person.department}</p>
            )}
            
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-xs">
                <DoorOpen className="h-3 w-3 text-muted-foreground" />
                <span className={cn(
                  person.room_count > 0 ? "text-foreground" : "text-muted-foreground"
                )}>
                  {person.room_count} room{person.room_count !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Key className="h-3 w-3 text-muted-foreground" />
                <span className={cn(
                  person.key_count > 0 ? "text-foreground" : "text-muted-foreground"
                )}>
                  {person.key_count} key{person.key_count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PersonnelGridProps {
  personnel: PersonnelAccessRecord[];
  isLoading: boolean;
  onPersonClick: (person: PersonnelAccessRecord) => void;
}

function PersonnelGrid({ personnel, isLoading, onPersonClick }: PersonnelGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (personnel.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No personnel found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-tour="personnel-card">
      {personnel.map(person => (
        <PersonnelCard 
          key={person.id} 
          person={person} 
          onClick={() => onPersonClick(person)}
        />
      ))}
    </div>
  );
}

function StatsCard({ 
  icon: Icon, 
  title, 
  value, 
  className 
}: { 
  icon: React.ElementType; 
  title: string; 
  value: number;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AccessAssignmentsContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPerson, setSelectedPerson] = useState<PersonnelAccessRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [autoOpenProcessed, setAutoOpenProcessed] = useState(false);
  
  const { 
    personnel, 
    registeredUsers, 
    courtPersonnel, 
    stats, 
    isLoading 
  } = usePersonnelAccess();

  // Auto-open dialog when assign_user param is present (from notification deep link)
  const assignUserId = searchParams.get('assign_user');
  
  useEffect(() => {
    if (assignUserId && personnel.length > 0 && !autoOpenProcessed && !isLoading) {
      const personToAssign = personnel.find(p => p.id === assignUserId);
      if (personToAssign) {
        setSelectedPerson(personToAssign);
        setDialogOpen(true);
        setAutoOpenProcessed(true);
        // Clear the URL parameter after opening dialog
        setSearchParams({}, { replace: true });
      }
    }
  }, [assignUserId, personnel, isLoading, autoOpenProcessed, setSearchParams]);

  const handlePersonClick = (person: PersonnelAccessRecord) => {
    setSelectedPerson(person);
    setDialogOpen(true);
  };

  const getFilteredPersonnel = () => {
    let filtered = personnel;
    
    if (activeTab === "users") {
      filtered = registeredUsers;
    } else if (activeTab === "personnel") {
      filtered = courtPersonnel;
    }
    
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(lowerQuery) ||
        p.email?.toLowerCase().includes(lowerQuery) ||
        p.department?.toLowerCase().includes(lowerQuery) ||
        p.title?.toLowerCase().includes(lowerQuery)
      );
    }
    
    return filtered;
  };

  const filteredPersonnel = getFilteredPersonnel();

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Access & Assignments</h1>
        <p className="text-muted-foreground">
          Manage room and key assignments for registered users and court personnel
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard icon={Users} title="Total Personnel" value={stats.total} />
        <StatsCard icon={UserCheck} title="Registered Users" value={stats.registeredUsers} />
        <StatsCard icon={DoorOpen} title="With Room Access" value={stats.withRoomAccess} />
        <StatsCard icon={Key} title="With Keys" value={stats.withKeyAccess} />
      </div>

      {/* Tabs and Search */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <TabsList data-tour="personnel-search">
            <TabsTrigger value="all" className="gap-2">
              <Users className="h-4 w-4" />
              All ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Users ({stats.registeredUsers})
            </TabsTrigger>
            <TabsTrigger value="personnel" className="gap-2">
              <Building2 className="h-4 w-4" />
              Personnel ({stats.courtPersonnel})
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value="all" className="mt-6">
          <PersonnelGrid personnel={filteredPersonnel} isLoading={isLoading} onPersonClick={handlePersonClick} />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <PersonnelGrid personnel={filteredPersonnel} isLoading={isLoading} onPersonClick={handlePersonClick} />
        </TabsContent>

        <TabsContent value="personnel" className="mt-6">
          <PersonnelGrid personnel={filteredPersonnel} isLoading={isLoading} onPersonClick={handlePersonClick} />
        </TabsContent>
      </Tabs>

      <PersonnelQuickAssignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        person={selectedPerson}
      />
    </div>
  );
}

export default function AccessAssignments() {
  return (
    <RoleBasedRoute feature="occupants">
      <AccessAssignmentsContent />
    </RoleBasedRoute>
  );
}
