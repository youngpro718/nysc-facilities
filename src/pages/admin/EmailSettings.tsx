import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Mail, CheckCircle, AlertCircle, Copy } from 'lucide-react';

export default function EmailSettings() {
  const [facilityEmail, setFacilityEmail] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const webhookUrl = `https://fmymhtuiqzhupjyopfvi.supabase.co/functions/v1/receive-form-email`;

  useEffect(() => {
    loadEmailSettings();
  }, []);

  const loadEmailSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('admin_email')
        .single();

      if (error) throw error;

      if (data?.admin_email) {
        setFacilityEmail(data.admin_email);
        setIsConfigured(true);
      }
    } catch (error: any) {
      console.error('Error loading email settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!facilityEmail || !facilityEmail.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ admin_email: facilityEmail })
        .eq('id', (await supabase.from('system_settings').select('id').single()).data?.id);

      if (error) throw error;

      setIsConfigured(true);
      toast({
        title: 'Email Settings Saved',
        description: 'The facility email address has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error saving email settings:', error);
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save email settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: 'Copied!',
      description: 'Webhook URL copied to clipboard.',
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-muted-foreground">Loading email settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Email Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Configure the email address where form submissions will be received
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Facility Email Address
            </CardTitle>
            <CardDescription>
              This email address will be displayed on all forms and used for form submission notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="facility-email">Email Address *</Label>
              <Input
                id="facility-email"
                type="email"
                placeholder="facilities@yourdomain.com"
                value={facilityEmail}
                onChange={(e) => setFacilityEmail(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter the email address where you want to receive form submissions
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              {isConfigured ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">Email configured</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium">Email not configured</span>
                </>
              )}
            </div>

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Email Address'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Receiving Setup (Optional - Advanced)</CardTitle>
            <CardDescription>
              Set up email receiving with Resend to automatically process form submissions sent via email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  value={webhookUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyWebhookUrl}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Use this URL when setting up inbound email webhooks in Resend
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                To Enable Email Receiving:
              </p>
              <ol className="text-sm text-blue-900 dark:text-blue-100 space-y-2 list-decimal list-inside">
                <li>Sign up at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline">resend.com</a></li>
                <li>Verify your domain at <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline">resend.com/domains</a></li>
                <li>Create an API key at <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">resend.com/api-keys</a></li>
                <li>Add the <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">RESEND_API_KEY</code> secret to your Supabase project</li>
                <li>Configure inbound email rules in Resend to point to the webhook URL above</li>
              </ol>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Current Status:</p>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm">Email receiving not yet configured</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Forms can still be uploaded manually via the Form Intake page
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
