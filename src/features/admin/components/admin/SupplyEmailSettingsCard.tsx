// Admin toggle + recipient list for supply-team new-request emails.
// Requester receipt + fulfillment emails always send; only the team alert
// is gated by this toggle.
import { useEffect, useState } from 'react';
import { Mail, X, Plus, Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@shared/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface Settings {
  supply_team_notifications_enabled: boolean;
  supply_team_recipients: string[];
}

interface SupplyEmailSettingsCardProps {
  onTestSent?: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SupplyEmailSettingsCard({ onTestSent }: SupplyEmailSettingsCardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    supply_team_notifications_enabled: false,
    supply_team_recipients: [],
  });
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('supply_email_settings')
        .select('supply_team_notifications_enabled, supply_team_recipients')
        .eq('id', true)
        .maybeSingle();
      if (error) logger.error('load supply_email_settings failed', error);
      if (data) {
        setSettings({
          supply_team_notifications_enabled: data.supply_team_notifications_enabled,
          supply_team_recipients: data.supply_team_recipients ?? [],
        });
      }
      setLoading(false);
    })();
  }, []);

  const save = async (next: Settings) => {
    setSaving(true);
    const { error } = await supabase
      .from('supply_email_settings')
      .update({
        supply_team_notifications_enabled: next.supply_team_notifications_enabled,
        supply_team_recipients: next.supply_team_recipients,
        updated_at: new Date().toISOString(),
      })
      .eq('id', true);
    setSaving(false);
    if (error) {
      logger.error('save supply_email_settings failed', error);
      toast({
        title: 'Could not save',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
    setSettings(next);
    return true;
  };

  const toggle = async (enabled: boolean) => {
    const ok = await save({ ...settings, supply_team_notifications_enabled: enabled });
    if (ok) {
      toast({
        title: enabled ? 'Supply team emails ON' : 'Supply team emails OFF',
        description: enabled
          ? `New requests will notify ${settings.supply_team_recipients.length} recipient(s).`
          : 'Only you will see new requests in the app.',
      });
    }
  };

  const addRecipient = async () => {
    const email = newEmail.trim();
    if (!EMAIL_RE.test(email)) {
      toast({ title: 'Invalid email', variant: 'destructive' });
      return;
    }
    if (settings.supply_team_recipients.includes(email)) {
      toast({ title: 'Already added' });
      return;
    }
    const ok = await save({
      ...settings,
      supply_team_recipients: [...settings.supply_team_recipients, email],
    });
    if (ok) setNewEmail('');
  };

  const removeRecipient = async (email: string) => {
    await save({
      ...settings,
      supply_team_recipients: settings.supply_team_recipients.filter((e) => e !== email),
    });
  };

  const sendTestEmail = async () => {
    setTesting(true);
    const { data, error } = await supabase.functions.invoke('send-supply-email', {
      body: { type: 'team_test' },
    });
    setTesting(false);

    if (error) {
      logger.error('send supply team test email failed', error);
      toast({
        title: 'Test email failed',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    const result = data?.result ?? {};
    toast({
      title: 'Test email sent',
      description: `Status: ${result.last_event ?? 'sent'}${result.id ? ` · ${result.id}` : ''}`,
    });
    onTestSent?.();
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" />
              Supply team email alerts
            </CardTitle>
            <CardDescription className="mt-1">
              When ON, the addresses below get emailed each time a new supply request is submitted.
              Requester receipts and fulfillment emails always send regardless of this toggle.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Switch
              checked={settings.supply_team_notifications_enabled}
              onCheckedChange={toggle}
              disabled={loading || saving}
              aria-label="Enable supply team emails"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {settings.supply_team_recipients.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No recipients yet.</p>
          )}
          {settings.supply_team_recipients.map((email) => (
            <Badge key={email} variant="secondary" className="gap-1 pr-1 py-1">
              <span className="text-xs">{email}</span>
              <button
                type="button"
                onClick={() => removeRecipient(email)}
                className="rounded-sm hover:bg-background/60 p-0.5"
                aria-label={`Remove ${email}`}
                disabled={saving}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Label htmlFor="new-supply-email" className="sr-only">
            Add recipient
          </Label>
          <Input
            id="new-supply-email"
            type="email"
            placeholder="add@nycourts.gov"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addRecipient();
              }
            }}
            disabled={saving}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addRecipient}
            disabled={saving || !newEmail.trim()}
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {!settings.supply_team_notifications_enabled ? (
            <p className="text-xs text-muted-foreground">
              Test mode — flip the toggle when you're ready to start alerting the supply team.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Send a test to confirm delivery with the current recipient list.
            </p>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={sendTestEmail}
            disabled={saving || testing || settings.supply_team_recipients.length === 0}
          >
            {testing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            Send test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
