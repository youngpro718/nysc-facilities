// DEPRECATED: Do not use. Notification settings are centralized in
// `src/components/profile/EnhancedUserSettings.tsx` and surfaced via SettingsPage.
// This file is retained temporarily for reference and will be removed after cleanup.
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const notificationSchema = z.object({
  email: z.object({
    issues: z.boolean(),
    maintenance: z.boolean(),
    system_updates: z.boolean(),
  }),
  push: z.object({
    issues: z.boolean(),
    maintenance: z.boolean(),
    system_updates: z.boolean(),
  }),
  alert_preferences: z.object({
    priority_threshold: z.enum(['low', 'medium', 'high']),
    maintenance_reminders: z.boolean(),
    system_updates: z.boolean(),
  }),
});

type NotificationValues = z.infer<typeof notificationSchema>;

const defaultValues: NotificationValues = {
  email: {
    issues: true,
    maintenance: true,
    system_updates: true,
  },
  push: {
    issues: true,
    maintenance: true,
    system_updates: true,
  },
  alert_preferences: {
    priority_threshold: 'high',
    maintenance_reminders: true,
    system_updates: true,
  },
};

export function NotificationPreferences() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<NotificationValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues,
  });

  useEffect(() => {
    let mounted = true;

    async function loadPreferences() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('notification_preferences')
          .eq('id', user.id)
          .single();

        if (profile?.notification_preferences && mounted) {
          // Validate the data against our schema
          try {
            const validatedData = notificationSchema.parse(profile.notification_preferences);
            form.reset(validatedData);
          } catch (error) {
            console.error('Invalid notification preferences format:', error);
            // Reset to defaults if data is invalid
            form.reset(defaultValues);
          }
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    }

    loadPreferences();
    return () => {
      mounted = false;
    };
  }, [form]);

  async function onSubmit(data: NotificationValues) {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: data,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update notification preferences.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Email Notifications</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email.issues"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Issues</FormLabel>
                    <FormDescription>
                      Receive email notifications about new and updated issues
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email.maintenance"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Maintenance</FormLabel>
                    <FormDescription>
                      Get notified about scheduled maintenance activities
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email.system_updates"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">System Updates</FormLabel>
                    <FormDescription>
                      Receive notifications about system changes and updates
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Push Notifications</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="push.issues"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Issues</FormLabel>
                    <FormDescription>
                      Receive push notifications for issues
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="push.maintenance"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Maintenance</FormLabel>
                    <FormDescription>
                      Get push alerts for maintenance activities
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="push.system_updates"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">System Updates</FormLabel>
                    <FormDescription>
                      Receive push notifications for system updates
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Preferences"}
        </Button>
      </form>
    </Form>
  );
}