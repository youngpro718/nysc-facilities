
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  SearchIcon, 
  PencilIcon, 
  Loader2,
  PhoneIcon,
  MapPinIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TermPersonnel {
  id: string;
  term_id: string;
  name: string;
  role: string;
  phone?: string;
  extension?: string;
  room?: string;
  floor?: string;
  created_at: string;
  updated_at: string;
}

interface TermPersonnelListProps {
  termId: string;
}

export function TermPersonnelList({ termId }: TermPersonnelListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: personnel, isLoading } = useQuery({
    queryKey: ["term-personnel", termId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("term_personnel")
        .select("*")
        .eq("term_id", termId);
      
      if (error) throw error;
      return data as TermPersonnel[];
    },
    enabled: !!termId
  });

  const filteredPersonnel = personnel?.filter(person => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (person.name && person.name.toLowerCase().includes(query)) ||
      (person.role && person.role.toLowerCase().includes(query)) ||
      (person.room && person.room.toLowerCase().includes(query))
    );
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!personnel || personnel.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md">
        <p className="text-muted-foreground mb-4">No personnel found for this term.</p>
        <Button>
          <PencilIcon className="h-4 w-4 mr-2" />
          Add Personnel
        </Button>
      </div>
    );
  }

  function getRoleBadge(role: string) {
    switch(role.toLowerCase()) {
      case 'judge':
      case 'justice':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">{role}</Badge>;
      case 'clerk':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{role}</Badge>;
      case 'sergeant':
      case 'officer':
        return <Badge className="bg-green-100 text-green-800 border-green-200">{role}</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search personnel..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button>
          <PencilIcon className="h-4 w-4 mr-2" />
          Add Personnel
        </Button>
      </div>

      <div className="border rounded-md">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPersonnel?.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">{person.name}</TableCell>
                  <TableCell>{getRoleBadge(person.role)}</TableCell>
                  <TableCell>
                    {person.phone ? (
                      <span className="flex items-center gap-1">
                        <PhoneIcon className="h-3 w-3" />
                        {person.phone}
                        {person.extension && ` x${person.extension}`}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {(person.room || person.floor) ? (
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="h-3 w-3" />
                        {person.room && `Room ${person.room}`}
                        {person.room && person.floor && ", "}
                        {person.floor && `Floor ${person.floor}`}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
