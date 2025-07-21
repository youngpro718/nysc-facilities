import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import {
  Palette,
  Monitor,
  Moon,
  Sun,
  Globe,
  Languages,
  MapPin,
  Calendar,
  Clock,
  Lock,
  Key,
  Accessibility,
  Volume2,
  VolumeX,
  Eye,
  Keyboard,
  MousePointer
} from 'lucide-react';

interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  color_scheme: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  compact_mode: boolean;
  high_contrast: boolean;
  font_size: 'small' | 'medium' | 'large';
  language: 'en' | 'es' | 'fr';
  timezone: string;
  date_format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  time_format: '12h' | '24h';
  two_factor_enabled: boolean;
  session_timeout: number;
  login_notifications: boolean;
  device_tracking: boolean;
  screen_reader_support: boolean;
  keyboard_navigation: boolean;
  motion_reduced: boolean;
  text_to_speech: boolean;
}

interface SettingsTabsProps {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

export function AppearanceTab({ settings, updateSetting }: SettingsTabsProps) {
  return (
    <TabsContent value="appearance" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Theme</Label>
              <Select
                value={settings.theme}
                onValueChange={(value: any) => updateSetting('theme', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Color Scheme</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {['blue', 'green', 'purple', 'orange', 'red'].map((color) => (
                  <button
                    key={color}
                    onClick={() => updateSetting('color_scheme', color as any)}
                    className={`h-10 rounded-md border-2 transition-all ${
                      settings.color_scheme === color
                        ? 'border-primary scale-105'
                        : 'border-muted hover:border-muted-foreground'
                    }`}
                    style={{
                      backgroundColor: {
                        blue: '#3b82f6',
                        green: '#10b981',
                        purple: '#8b5cf6',
                        orange: '#f59e0b',
                        red: '#ef4444'
                      }[color]
                    }}
                  >
                    <span className="sr-only">{color}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Font Size</Label>
              <Select
                value={settings.font_size}
                onValueChange={(value: any) => updateSetting('font_size', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact Mode</Label>
                <p className="text-sm text-muted-foreground">Use smaller spacing and elements</p>
              </div>
              <Switch
                checked={settings.compact_mode}
                onCheckedChange={(value) => updateSetting('compact_mode', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>High Contrast</Label>
                <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
              </div>
              <Switch
                checked={settings.high_contrast}
                onCheckedChange={(value) => updateSetting('high_contrast', value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

export function LanguageTab({ settings, updateSetting }: SettingsTabsProps) {
  return (
    <TabsContent value="language" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language & Region
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Language
              </Label>
              <Select
                value={settings.language}
                onValueChange={(value: any) => updateSetting('language', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Timezone
              </Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => updateSetting('timezone', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Format
              </Label>
              <Select
                value={settings.date_format}
                onValueChange={(value: any) => updateSetting('date_format', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Format
              </Label>
              <Select
                value={settings.time_format}
                onValueChange={(value: any) => updateSetting('time_format', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12 Hour</SelectItem>
                  <SelectItem value="24h">24 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

export function SecurityTab({ settings, updateSetting }: SettingsTabsProps) {
  return (
    <TabsContent value="security" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Two-Factor Authentication
                </Label>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <div className="flex items-center gap-2">
                {settings.two_factor_enabled && (
                  <Badge variant="secondary" className="text-green-600">
                    Enabled
                  </Badge>
                )}
                <Switch
                  checked={settings.two_factor_enabled}
                  onCheckedChange={(value) => updateSetting('two_factor_enabled', value)}
                />
              </div>
            </div>

            <div>
              <Label>Session Timeout (minutes)</Label>
              <Select
                value={settings.session_timeout.toString()}
                onValueChange={(value) => updateSetting('session_timeout', parseInt(value))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="480">8 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Login Notifications</Label>
                <p className="text-sm text-muted-foreground">Get notified of new login attempts</p>
              </div>
              <Switch
                checked={settings.login_notifications}
                onCheckedChange={(value) => updateSetting('login_notifications', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Device Tracking</Label>
                <p className="text-sm text-muted-foreground">Track devices used to access your account</p>
              </div>
              <Switch
                checked={settings.device_tracking}
                onCheckedChange={(value) => updateSetting('device_tracking', value)}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-medium">Security Actions</h3>
            
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start">
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button variant="outline" className="justify-start">
                <Monitor className="h-4 w-4 mr-2" />
                View Active Sessions
              </Button>
              <Button variant="outline" className="justify-start text-red-600 hover:text-red-700">
                <Lock className="h-4 w-4 mr-2" />
                Sign Out All Devices
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

export function AccessibilityTab({ settings, updateSetting }: SettingsTabsProps) {
  return (
    <TabsContent value="accessibility" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            Accessibility Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Screen Reader Support
                </Label>
                <p className="text-sm text-muted-foreground">Optimize for screen readers</p>
              </div>
              <Switch
                checked={settings.screen_reader_support}
                onCheckedChange={(value) => updateSetting('screen_reader_support', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Keyboard className="h-4 w-4" />
                  Keyboard Navigation
                </Label>
                <p className="text-sm text-muted-foreground">Enhanced keyboard navigation support</p>
              </div>
              <Switch
                checked={settings.keyboard_navigation}
                onCheckedChange={(value) => updateSetting('keyboard_navigation', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <MousePointer className="h-4 w-4" />
                  Reduce Motion
                </Label>
                <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
              </div>
              <Switch
                checked={settings.motion_reduced}
                onCheckedChange={(value) => updateSetting('motion_reduced', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  {settings.text_to_speech ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  Text-to-Speech
                </Label>
                <p className="text-sm text-muted-foreground">Enable text-to-speech functionality</p>
              </div>
              <Switch
                checked={settings.text_to_speech}
                onCheckedChange={(value) => updateSetting('text_to_speech', value)}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-medium">Accessibility Resources</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Use Tab key to navigate between elements</p>
              <p>• Press Enter or Space to activate buttons</p>
              <p>• Use arrow keys in dropdown menus</p>
              <p>• Press Escape to close dialogs and menus</p>
            </div>
            
            <Button variant="outline" className="justify-start">
              <Accessibility className="h-4 w-4 mr-2" />
              View Accessibility Guide
            </Button>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
