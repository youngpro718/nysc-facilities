import { getErrorMessage } from "@/lib/errorUtils";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Building2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

/**
 * ProfileOnboarding - Profile Completion Page
 * 
 * Collects required profile information from new users.
 * Required fields: first_name, last_name
 */
export default function ProfileOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Load existing profile data if available
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, title, department')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setTitle(profile.title || '');
        setDepartment(profile.department || '');
      }
    } catch (err) {
      logger.error('[ProfileOnboarding] Load profile failed:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          title: title.trim() || null,
          department: department.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      logger.debug('[ProfileOnboarding] Profile updated successfully');
      toast({
        title: 'Profile Complete',
        description: 'Your profile has been updated successfully.',
      });

      // Redirect to dashboard
      navigate('/', { replace: true });
    } catch (err) {
      logger.error('[ProfileOnboarding] Update failed:', err);
      setError(getErrorMessage(err) || 'Failed to update profile');
      toast({
        title: 'Update Failed',
        description: 'Could not update your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Complete your profile</CardTitle>
          <CardDescription>
            Please provide some basic information to get started
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            {/* Title (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                type="text"
                placeholder="Facilities Manager"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Department (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="department">Department (Optional)</Label>
              <Input
                id="department"
                type="text"
                placeholder="Facilities"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Save & Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
