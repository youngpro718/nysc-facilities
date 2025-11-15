import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '../../lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Users, Copy, CheckCircle, AlertCircle } from 'lucide-react';

interface CourtPersonnel {
  id: string;
  name: string;
  role: string;
  phone?: string;
  room?: string;
  extension?: string;
  floor?: string;
}

export function DuplicateCourtPersonnel() {
  const [isLoading, setIsLoading] = useState(false);
  const [courtPersonnel, setCourtPersonnel] = useState<CourtPersonnel[]>([]);
  const [duplicatedCount, setDuplicatedCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const fetchCourtPersonnel = async () => {
    try {
      const { data, error } = await supabase
        .from('term_personnel')
        .select('*')
        .order('name');

      if (error) throw error;
      setCourtPersonnel(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching court personnel:', error);
      toast({
        title: "Error",
        description: "Failed to fetch court personnel",
        variant: "destructive"
      });
      return [];
    }
  };

  const duplicatePersonnelToProfiles = async () => {
    setIsLoading(true);
    setDuplicatedCount(0);

    try {
      // First, fetch all court personnel
      const personnel = await fetchCourtPersonnel();
      
      if (personnel.length === 0) {
        toast({
          title: "No Personnel Found",
          description: "No court personnel found to duplicate",
          variant: "destructive"
        });
        return;
      }

      // Check existing profiles to avoid duplicates
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('first_name, last_name, email');

      const existingNames = new Set(
        existingProfiles?.map(p => `${p.first_name} ${p.last_name}`.toLowerCase()) || []
      );
      const existingEmails = new Set(
        existingProfiles?.map(p => p.email?.toLowerCase()) || []
      );

      let duplicated = 0;

      // Process each court personnel
      for (const person of personnel) {
        // Parse name into first and last name
        const nameParts = person.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        const email = `${person.name.toLowerCase().replace(/\s+/g, '.')}@court.nysc.gov`;

        // Skip if already exists
        if (existingNames.has(fullName) || existingEmails.has(email)) {
          continue;
        }

        // Generate a UUID for the profile
        const profileId = crypto.randomUUID();
        
        // Insert into profiles
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: profileId,
            first_name: firstName || null,
            last_name: lastName || null,
            email: email || null,
            phone: person.phone || null,
            department: 'Court Administration',
            title: person.role || null,
            access_level: 'read' as const,
            verification_status: 'pending' as const,
            is_approved: false
          });

        if (!error) {
          duplicated++;
          setDuplicatedCount(duplicated);
        } else {
          console.error(`Error duplicating ${person.name}:`, error);
        }
      }

      setShowResults(true);
      toast({
        title: "Success!",
        description: `Successfully duplicated ${duplicated} court personnel to profiles`,
        variant: "default"
      });

    } catch (error) {
      console.error('Error duplicating personnel:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate court personnel",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCourtPersonnel = async () => {
    setIsLoading(true);
    await fetchCourtPersonnel();
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicate Court Personnel to User Profiles
          </CardTitle>
          <CardDescription>
            Copy all court personnel from the term_personnel table into the profiles table 
            so they can be managed through the regular user management system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={loadCourtPersonnel}
              disabled={isLoading}
              variant="outline"
            >
              <Users className="h-4 w-4 mr-2" />
              Load Court Personnel ({courtPersonnel.length})
            </Button>
            
            <Button 
              onClick={duplicatePersonnelToProfiles}
              disabled={isLoading || courtPersonnel.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                "Duplicating..."
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate to Profiles
                </>
              )}
            </Button>
          </div>

          {showResults && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">
                  Successfully duplicated {duplicatedCount} court personnel!
                </span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                You can now manage these personnel through the regular user management interface.
                They will appear as pending users that need to be approved and activated.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {courtPersonnel.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Court Personnel Preview</CardTitle>
            <CardDescription>
              These are the court personnel that will be duplicated to profiles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {courtPersonnel.map((person) => (
                <div key={person.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{person.name}</div>
                    <div className="text-sm text-gray-600">{person.role}</div>
                    {person.phone && (
                      <div className="text-sm text-gray-500">📞 {person.phone}</div>
                    )}
                    {person.room && (
                      <div className="text-sm text-gray-500">🏢 Room {person.room}</div>
                    )}
                  </div>
                  <Badge variant="secondary">Court Personnel</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
