import { getErrorMessage } from "@/lib/errorUtils";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@shared/hooks/use-toast';
import { logger } from '@/lib/logger';
import { APP_INFO } from '@/lib/appInfo';

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
  const [requestedRole, setRequestedRole] = useState<string>('');
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
        .select('first_name, last_name, title, department, requested_role')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setTitle(profile.title || '');
        setDepartment(profile.department || '');
        setRequestedRole((profile as any).requested_role || '');
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
    <div
      className="light min-h-[100dvh] flex flex-col items-center justify-center px-4"
      style={{
        colorScheme: 'light',
        backgroundColor: '#e2e8f0',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="w-full max-w-[400px] space-y-6">
        {/* Logo + name */}
        <div className="flex items-center gap-3">
          <img
            src="/nysc-logo-light.webp"
            alt="NYSC Logo"
            width={44}
            height={44}
            className="h-11 w-11 object-contain shrink-0"
          />
          <div>
            <p className="font-semibold text-[15px] text-slate-900 leading-none">{APP_INFO.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{APP_INFO.organization}</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
          <div className="text-center">
            <h1 className="text-lg font-semibold text-slate-900">Complete Your Profile</h1>
            <p className="text-sm text-slate-500 mt-1">
              {requestedRole === 'purchasing' && 'Welcome to NYSC Facilities — as a Purchasing user, you\'ll have access to inventory tracking and supply management.'}
              {requestedRole === 'cmc' && 'Welcome to NYSC Facilities — as a Management user, you\'ll oversee court operations and scheduling.'}
              {requestedRole === 'court_officer' && 'Welcome to NYSC Facilities — as a Court Officer, you\'ll manage keys and building access.'}
              {requestedRole === 'court_aide' && 'Welcome to NYSC Facilities — as a Court Aide, you\'ll fulfill supply requests and manage inventory.'}
              {requestedRole === 'standard' && 'Welcome to NYSC Facilities — you\'ll be able to report issues and request supplies.'}
              {!requestedRole && 'Just a few details to get you started'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-medium text-slate-600">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="h-10 rounded-xl text-sm"
                  autoComplete="given-name"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-medium text-slate-600">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="h-10 rounded-xl text-sm"
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-medium text-slate-600">Title (Optional)</Label>
              <Input
                id="title"
                type="text"
                placeholder="Facilities Manager"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 rounded-xl text-sm"
                autoComplete="organization-title"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="department" className="text-xs font-medium text-slate-600">Department (Optional)</Label>
              <Input
                id="department"
                type="text"
                placeholder="Facilities"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="h-10 rounded-xl text-sm"
                autoComplete="organization"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-10 rounded-xl text-sm font-medium"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save & Continue'}
            </Button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          Need help?{' '}
          <a href={APP_INFO.support.emailHref} className="underline hover:text-slate-600 transition-colors">
            {APP_INFO.support.email}
          </a>
        </p>
      </div>
    </div>
  );
}
