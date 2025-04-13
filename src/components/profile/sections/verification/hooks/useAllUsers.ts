import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
  status: 'active' | 'inactive' | 'pending';
  profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    department: string | null;
    title: string | null;
  };
}

// Define profile update types to avoid deep instantiation
type VerificationStatus = 'pending' | 'verified' | 'rejected';
type AccessLevel = 'none' | 'read' | 'write' | 'admin';

export function useAllUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
  // Fetch all users
  const {
    data: users = [],
    isLoading,
    error,
    refetch
  } = useQuery<User[]>({
    queryKey: ["all-users"],
    queryFn: async () => {
      try {
        // Check authentication status
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          console.log("No active session");
          return [];
        }

        console.log("Fetching users from profiles table...");
        // Get all users directly from the profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            last_name,
            department,
            title,
            email,
            created_at,
            last_login_at,
            access_level,
            verification_status
          `);

        if (error) {
          console.error("Error fetching profiles:", error);
          throw error;
        }

        console.log("Profiles data:", data);

        // If no data, return empty array
        if (!data || data.length === 0) {
          console.log("No profiles found");
          return [];
        }

        // Transform the data to match the User interface
        const transformedUsers = data.map((item: any) => {
          // Determine user status based on verification_status
          let status: 'active' | 'inactive' | 'pending' = 'active';
          if (item.verification_status === 'pending') {
            status = 'pending';
          } else if (item.verification_status === 'rejected') {
            status = 'inactive';
          }
          
          // Determine admin status based on access_level
          const isAdmin = item.access_level === 'admin';
          
          return {
            id: item.id,
            email: item.email || '',
            created_at: item.created_at || new Date().toISOString(),
            last_sign_in_at: item.last_login_at,
            is_admin: isAdmin,
            status,
            profile: {
              id: item.id,
              first_name: item.first_name,
              last_name: item.last_name,
              department: item.department,
              title: item.title
            }
          };
        });

        console.log("Transformed users:", transformedUsers);
        return transformedUsers;
      } catch (error: any) {
        console.error("Error in useAllUsers queryFn:", error);
        
        // Check for auth errors
        if (error.__isAuthError) {
          toast.error("Authentication error. Please sign in again.");
        } else {
          toast.error(`Failed to load users: ${error.message || "Unknown error"}`);
        }
        
        return [];
      }
    },
    staleTime: 60000 // 1 minute
  });

  // Log users whenever they change
  useEffect(() => {
    console.log("Current users in useAllUsers:", users);
  }, [users]);

  // Fetch departments for filtering
  const { data: departments = [] } = useQuery<string[]>({
    queryKey: ["user-departments"],
    queryFn: async () => {
      try {
        // Check authentication status
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          return [];
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('department')
          .not('department', 'is', null);

        if (error) throw error;

        // Extract unique departments
        const uniqueDepartments = [...new Set(data.map(item => item.department).filter(Boolean))];
        console.log("Departments:", uniqueDepartments);
        return uniqueDepartments as string[];
      } catch (error) {
        console.error("Error fetching departments:", error);
        return [];
      }
    },
    staleTime: 300000 // 5 minutes
  });

  // Filter users based on search query and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === "" || 
      (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       user.profile?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       user.profile?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    
    const matchesDepartment = departmentFilter === "all" || 
      user.profile?.department === departmentFilter;

    const matchesRole = roleFilter === "all" || 
      (roleFilter === "admin" && user.is_admin) ||
      (roleFilter === "user" && !user.is_admin);

    return matchesSearch && matchesStatus && matchesDepartment && matchesRole;
  });

  console.log("Filtered users:", filteredUsers);

  // Update user status
  const updateUserStatus = async (userId: string, status: 'active' | 'inactive') => {
    try {
      // Check authentication status
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error("You must be signed in to perform this action");
        return;
      }

      // Update the verification_status in profiles table
      const verificationStatus: VerificationStatus = status === 'active' ? 'verified' : 'rejected';
      
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: verificationStatus } as { verification_status: VerificationStatus })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success(`User ${status === 'active' ? 'activated' : 'deactivated'} successfully`);
      refetch();
    } catch (error: any) {
      console.error("Error updating user status:", error);
      toast.error(`Failed to update user status: ${error.message || "Unknown error"}`);
    }
  };

  // Update user role
  const updateUserRole = async (userId: string, isAdmin: boolean) => {
    try {
      // Check authentication status
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error("You must be signed in to perform this action");
        return;
      }

      // Update the access_level in profiles table
      const accessLevel: AccessLevel = isAdmin ? 'admin' : 'write';
      
      const { error } = await supabase
        .from('profiles')
        .update({ access_level: accessLevel } as { access_level: AccessLevel })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success(`User role updated successfully`);
      refetch();
    } catch (error: any) {
      console.error("Error updating user role:", error);
      toast.error(`Failed to update user role: ${error.message || "Unknown error"}`);
    }
  };

  // Delete user
  const deleteUser = async (userId: string) => {
    try {
      // Check authentication status
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error("You must be signed in to perform this action");
        return false;
      }

      // Delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      toast.success("User profile deleted successfully");
      refetch();
      return true;
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(`Failed to delete user: ${error.message || "Unknown error"}`);
      return false;
    }
  };

  return {
    users: filteredUsers,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    roleFilter,
    setRoleFilter,
    departments,
    updateUserStatus,
    updateUserRole,
    deleteUser,
    refetch
  };
}
