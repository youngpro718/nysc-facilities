import { useState, useEffect } from "react";
import { logger } from '@/lib/logger';
import { supabase } from "@/lib/supabase";
import { Profile, EmergencyContact } from "../types";
import { toast } from "sonner";

export function useAdminProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        // Handle emergency_contact which might be already an object or a string
        let parsedEmergencyContact: EmergencyContact | undefined;
        
        if (data.emergency_contact) {
          try {
            // If it's a string, try to parse it
            if (typeof data.emergency_contact === 'string') {
              parsedEmergencyContact = JSON.parse(data.emergency_contact);
            } 
            // If it's already an object, use it directly
            else if (typeof data.emergency_contact === 'object') {
              parsedEmergencyContact = data.emergency_contact as EmergencyContact;
            }
          } catch (e) {
            logger.warn('Failed to parse emergency contact:', e);
            parsedEmergencyContact = undefined;
          }
        }

        const parsedProfile: Profile = {
          ...data,
          emergency_contact: parsedEmergencyContact
        };

        setProfile(parsedProfile);
        setEditedProfile(parsedProfile);
        setError(null);
      }
    } catch (error) {
      logger.error("Error fetching profile:", error);
      setError("Failed to fetch profile");
      toast.error("Failed to fetch profile");
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      if (!editedProfile) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Only stringify if emergency_contact is an object and not already a string
      const dataToUpdate = {
        ...editedProfile,
        emergency_contact: editedProfile.emergency_contact && typeof editedProfile.emergency_contact === 'object'
          ? JSON.stringify(editedProfile.emergency_contact)
          : editedProfile.emergency_contact
      };

      const { error: updateError } = await supabase
        .from("profiles")
        .update(dataToUpdate)
        .eq("id", user.id);

      if (updateError) throw updateError;

      await fetchProfile();
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      logger.error("Error updating profile:", error);
      setError("Failed to update profile");
      toast.error("Failed to update profile");
    }
  };

  const startEditing = () => {
    setEditedProfile(profile);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditedProfile(profile);
    setIsEditing(false);
    setError(null);
  };

  const updateField = <K extends keyof Profile>(
    field: K,
    value: Profile[K]
  ) => {
    if (!editedProfile) return;

    setEditedProfile({
      ...editedProfile,
      [field]: value,
    });
  };

  return {
    profile,
    editedProfile,
    setEditedProfile,
    updateProfile,
    isLoading,
    error,
    isEditing,
    startEditing,
    cancelEditing,
    updateField,
  };
}
