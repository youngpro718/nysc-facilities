import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, Clock, Database, Key } from 'lucide-react';
import { toast } from 'sonner';

interface SecurityConfiguration {
  id: string;
  name: string;
  type: 'rate_limit' | 'access_control' | 'audit' | 'encryption';
  configuration: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RateLimitSettings {
  login: {
    max_attempts: number;
    window_minutes: number;
  };
  signup: {
    max_attempts: number;
    window_minutes: number;
  };
}

interface AccessControlSettings {
  max_session_duration: string;
  require_reauth_for_sensitive: boolean;
  max_concurrent_sessions: number;
}

interface AuditSettings {
  log_all_admin_actions: boolean;
  log_failed_attempts: boolean;
  retention_days: number;
}

interface EncryptionSettings {
  encrypt_sensitive_fields: boolean;
  key_rotation_days: number;
  hash_algorithm: string;
}

export const SecuritySettings = () => {
  const [configurations, setConfigurations] = useState<SecurityConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rateLimits, setRateLimits] = useState<RateLimitSettings>({
    login: { max_attempts: 5, window_minutes: 15 },
    signup: { max_attempts: 3, window_minutes: 60 }
  });
  const [accessControl, setAccessControl] = useState<AccessControlSettings>({
    max_session_duration: '24 hours',
    require_reauth_for_sensitive: true,
    max_concurrent_sessions: 3
  });
  const [auditSettings, setAuditSettings] = useState<AuditSettings>({
    log_all_admin_actions: true,
    log_failed_attempts: true,
    retention_days: 90
  });
  const [encryptionSettings, setEncryptionSettings] = useState<EncryptionSettings>({
    encrypt_sensitive_fields: true,
    key_rotation_days: 30,
    hash_algorithm: 'bcrypt'
  });

  const loadConfigurations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('security_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error loading security configurations:', error);
        toast.error('Failed to load security configurations');
      } else {
        setConfigurations(data || []);
        
        // Parse configurations into state
        data?.forEach(config => {
          switch (config.type) {
            case 'rate_limit':
              setRateLimits(config.configuration);
              break;
            case 'access_control':
              setAccessControl(config.configuration);
              break;
            case 'audit':
              setAuditSettings(config.configuration);
              break;
            case 'encryption':
              setEncryptionSettings(config.configuration);
              break;
          }
        });
      }
    } catch (error) {
      logger.error('Error loading configurations:', error);
      toast.error('Failed to load security configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfiguration = async (type: string, configuration: Record<string, unknown>) => {
    try {
      const { error } = await supabase
        .from('security_configurations')
        .update({
          configuration,
          updated_at: new Date().toISOString()
        })
        .eq('type', type);

      if (error) {
        logger.error('Error updating configuration:', error);
        toast.error('Failed to update security configuration');
      } else {
        toast.success('Security configuration updated');
        loadConfigurations();
      }
    } catch (error) {
      logger.error('Error updating configuration:', error);
      toast.error('Failed to update security configuration');
    }
  };

  const toggleConfiguration = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('security_configurations')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) {
        logger.error('Error toggling configuration:', error);
        toast.error('Failed to toggle configuration');
      } else {
        setConfigurations(prev => prev.map(config => 
          config.id === id ? { ...config, is_active: isActive } : config
        ));
        toast.success(`Configuration ${isActive ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      logger.error('Error toggling configuration:', error);
      toast.error('Failed to toggle configuration');
    }
  };

  useEffect(() => {
    loadConfigurations();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse">Loading security settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Security Settings</h2>
      </div>

      <Tabs defaultValue="rate-limiting" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rate-limiting" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Rate Limiting
          </TabsTrigger>
          <TabsTrigger value="access-control" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Access Control
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Audit Settings
          </TabsTrigger>
          <TabsTrigger value="encryption" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Encryption
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rate-limiting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limiting Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Login Attempts</h4>
                  <div className="space-y-2">
                    <label className="text-xs">Max Attempts</label>
                    <Input
                      type="number"
                      value={rateLimits.login.max_attempts}
                      onChange={(e) => setRateLimits(prev => ({
                        ...prev,
                        login: { ...prev.login, max_attempts: parseInt(e.target.value) || 5 }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs">Window (minutes)</label>
                    <Input
                      type="number"
                      value={rateLimits.login.window_minutes}
                      onChange={(e) => setRateLimits(prev => ({
                        ...prev,
                        login: { ...prev.login, window_minutes: parseInt(e.target.value) || 15 }
                      }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Signup Attempts</h4>
                  <div className="space-y-2">
                    <label className="text-xs">Max Attempts</label>
                    <Input
                      type="number"
                      value={rateLimits.signup.max_attempts}
                      onChange={(e) => setRateLimits(prev => ({
                        ...prev,
                        signup: { ...prev.signup, max_attempts: parseInt(e.target.value) || 3 }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs">Window (minutes)</label>
                    <Input
                      type="number"
                      value={rateLimits.signup.window_minutes}
                      onChange={(e) => setRateLimits(prev => ({
                        ...prev,
                        signup: { ...prev.signup, window_minutes: parseInt(e.target.value) || 60 }
                      }))}
                    />
                  </div>
                </div>
              </div>
              
              <Button onClick={() => updateConfiguration('rate_limit', rateLimits)}>
                Save Rate Limit Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access-control" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Access Control Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Session Duration</label>
                  <Select 
                    value={accessControl.max_session_duration}
                    onValueChange={(value) => setAccessControl(prev => ({ ...prev, max_session_duration: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 hour">1 Hour</SelectItem>
                      <SelectItem value="8 hours">8 Hours</SelectItem>
                      <SelectItem value="24 hours">24 Hours</SelectItem>
                      <SelectItem value="7 days">7 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Require Re-auth for Sensitive Actions</label>
                    <p className="text-xs text-muted-foreground">
                      Users must re-authenticate for admin actions
                    </p>
                  </div>
                  <Switch
                    checked={accessControl.require_reauth_for_sensitive}
                    onCheckedChange={(checked) => setAccessControl(prev => ({ 
                      ...prev, 
                      require_reauth_for_sensitive: checked 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Concurrent Sessions</label>
                  <Input
                    type="number"
                    value={accessControl.max_concurrent_sessions}
                    onChange={(e) => setAccessControl(prev => ({ 
                      ...prev, 
                      max_concurrent_sessions: parseInt(e.target.value) || 3 
                    }))}
                  />
                </div>
              </div>
              
              <Button onClick={() => updateConfiguration('access_control', accessControl)}>
                Save Access Control Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Log All Admin Actions</label>
                    <p className="text-xs text-muted-foreground">
                      Record all administrative operations
                    </p>
                  </div>
                  <Switch
                    checked={auditSettings.log_all_admin_actions}
                    onCheckedChange={(checked) => setAuditSettings(prev => ({ 
                      ...prev, 
                      log_all_admin_actions: checked 
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Log Failed Login Attempts</label>
                    <p className="text-xs text-muted-foreground">
                      Track unsuccessful authentication attempts
                    </p>
                  </div>
                  <Switch
                    checked={auditSettings.log_failed_attempts}
                    onCheckedChange={(checked) => setAuditSettings(prev => ({ 
                      ...prev, 
                      log_failed_attempts: checked 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Log Retention (days)</label>
                  <Input
                    type="number"
                    value={auditSettings.retention_days}
                    onChange={(e) => setAuditSettings(prev => ({ 
                      ...prev, 
                      retention_days: parseInt(e.target.value) || 90 
                    }))}
                  />
                </div>
              </div>
              
              <Button onClick={() => updateConfiguration('audit', auditSettings)}>
                Save Audit Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encryption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Encryption Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Encrypt Sensitive Fields</label>
                    <p className="text-xs text-muted-foreground">
                      Automatically encrypt sensitive data fields
                    </p>
                  </div>
                  <Switch
                    checked={encryptionSettings.encrypt_sensitive_fields}
                    onCheckedChange={(checked) => setEncryptionSettings(prev => ({ 
                      ...prev, 
                      encrypt_sensitive_fields: checked 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Key Rotation Period (days)</label>
                  <Input
                    type="number"
                    value={encryptionSettings.key_rotation_days}
                    onChange={(e) => setEncryptionSettings(prev => ({ 
                      ...prev, 
                      key_rotation_days: parseInt(e.target.value) || 30 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hash Algorithm</label>
                  <Select 
                    value={encryptionSettings.hash_algorithm}
                    onValueChange={(value) => setEncryptionSettings(prev => ({ 
                      ...prev, 
                      hash_algorithm: value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bcrypt">bcrypt</SelectItem>
                      <SelectItem value="argon2">Argon2</SelectItem>
                      <SelectItem value="scrypt">scrypt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={() => updateConfiguration('encryption', encryptionSettings)}>
                Save Encryption Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configuration Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {configurations.map((config) => (
              <div key={config.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{config.name}</p>
                  <Badge variant={config.is_active ? 'default' : 'secondary'}>
                    {config.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <Switch
                  checked={config.is_active}
                  onCheckedChange={(checked) => toggleConfiguration(config.id, checked)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};