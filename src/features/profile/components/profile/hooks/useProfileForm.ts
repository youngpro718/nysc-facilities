import { useForm } from "react-hook-form";
import { logger } from '@/lib/logger';
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@shared/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { PersonalInfoValues, personalInfoSchema, isValidEmergencyContact, JOB_TITLES } from "../schemas/profileSchema";

export function useProfileForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      department: "",
      title: "",
      title_other: "",
      time_zone: "UTC",
      language: "en",
      emergency_contact: {
        name: "",
        phone: "",
        relationship: "",
      },
    },
  });

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          logger.warn('Error loading profile:', error);
          return;
        }

        if (profile && mounted) {
          let emergencyContact = {
            name: "",
            phone: "",
            relationship: "",
          };

          if (profile.emergency_contact && isValidEmergencyContact(profile.emergency_contact)) {
            emergencyContact = {
              name: profile.emergency_contact.name || "",
              phone: profile.emergency_contact.phone || "",
              relationship: profile.emergency_contact.relationship || "",
            };
          }

          // Map stored title onto dropdown: if it matches a preset use it, otherwise treat as "Other".
          const storedTitle = (profile.title as string | null) || "";
          const matchesPreset = (JOB_TITLES as readonly string[]).includes(storedTitle);
          const titleValue = matchesPreset ? storedTitle : (storedTitle ? "Other" : "");
          const titleOther = matchesPreset || !storedTitle ? "" : storedTitle;

          form.reset({
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            phone: profile.phone || "",
            department: profile.department || "",
            title: titleValue,
            title_other: titleOther,
            time_zone: profile.time_zone || "UTC",
            language: profile.language || "en",
            emergency_contact: emergencyContact,
          });
        }
      } catch (error) {
        logger.warn('Error loading profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile information.",
          variant: "destructive",
        });
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [form, toast]);

  const onSubmit = async (data: PersonalInfoValues) => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        throw new Error(sessionError?.message || "Your session expired. Please sign in again.");
      }
      const user = session.user;

      // Resolve dropdown + "Other" into a single stored title string.
      const resolvedTitle = data.title === "Other" ? (data.title_other?.trim() || "") : data.title;

      const { data: updated, error } = await supabase
        .from('profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          department: data.department,
          title: resolvedTitle,
          time_zone: data.time_zone,
          language: data.language,
          emergency_contact: data.emergency_contact,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('id, department, title')
        .maybeSingle();

      if (error) throw error;
      if (!updated) {
        throw new Error("Profile didn't save. You may not have permission to edit these fields.");
      }

      toast({
        title: "Profile Updated",
        description: "Your personal information has been saved.",
      });

      // Refresh dependent caches (e.g. supply "finish your profile" banner).
      queryClient.invalidateQueries({ queryKey: ['profileCompleteness', user.id] });
    } catch (error) {
      logger.error('Error updating profile:', error);
      toast({
        title: "Couldn't save profile",
        description: error instanceof Error ? error.message : "Failed to update profile information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    onSubmit,
  };
}
