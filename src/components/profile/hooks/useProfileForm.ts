
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PersonalInfoValues, personalInfoSchema, isValidEmergencyContact } from "../schemas/profileSchema";

export function useProfileForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      phone: "",
      department: "",
      title: "",
      bio: "",
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
          console.error('Error loading profile:', error);
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

          form.reset({
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            username: profile.username || "",
            phone: profile.phone || "",
            department: profile.department || "",
            title: profile.title || "",
            bio: profile.bio || "",
            time_zone: profile.time_zone || "UTC",
            language: profile.language || "en",
            emergency_contact: emergencyContact,
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error(userError?.message || "No user found");
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: data.first_name,
          last_name: data.last_name,
          username: data.username,
          phone: data.phone,
          department: data.department,
          title: data.title,
          bio: data.bio,
          time_zone: data.time_zone,
          language: data.language,
          emergency_contact: data.emergency_contact,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your personal information has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile information.",
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
