import { getErrorMessage } from "@/lib/errorUtils";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Safe area top spacer */}
      <div className="pt-safe" />

      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-md mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Complete your profile</h1>
          <p className="text-muted-foreground mt-2">
            Just a few details to get you started
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="h-12 rounded-xl text-base"
                autoComplete="given-name"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="h-12 rounded-xl text-base"
                autoComplete="family-name"
              />
            </div>
          </div>

          {/* Title (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Title (Optional)</Label>
            <Input
              id="title"
              type="text"
              placeholder="Facilities Manager"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 rounded-xl text-base"
              autoComplete="organization-title"
            />
          </div>

          {/* Department (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="department" className="text-sm font-medium">Department (Optional)</Label>
            <Input
              id="department"
              type="text"
              placeholder="Facilities"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="h-12 rounded-xl text-base"
              autoComplete="organization"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-base font-semibold touch-manipulation active:scale-[0.98] transition-transform"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save & Continue'}
          </Button>
        </form>
      </div>

      {/* Safe area bottom spacer */}
      <div className="pb-safe" />
    </div>
  );
}
