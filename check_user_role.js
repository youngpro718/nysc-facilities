// Simple script to check and set user role
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fmymhtuiqzhupjyopfvi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZteW1odHVpcXpodXBqeW9wZnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIxNTQ0NjMsImV4cCI6MjA0NzczMDQ2M30.Ew_Ky6Jt8rnlDYVJEFJMmHCKfPIRfJHBwRJPEGZKfNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserRole() {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user logged in');
      return;
    }
    
    console.log('Current user ID:', user.id);
    console.log('Current user email:', user.email);
    
    // Check user role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);
      
    console.log('User roles:', roleData);
    if (roleError) console.error('Role error:', roleError);
    
    // Check profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id);
      
    console.log('User profile:', profileData);
    if (profileError) console.error('Profile error:', profileError);
    
    // If no admin role exists, create one
    if (!roleData || roleData.length === 0 || !roleData.find(r => r.role === 'admin')) {
      console.log('Setting user as admin...');
      const { data: insertData, error: insertError } = await supabase
        .from('user_roles')
        .upsert({ user_id: user.id, role: 'admin' });
        
      if (insertError) {
        console.error('Error setting admin role:', insertError);
      } else {
        console.log('Admin role set successfully:', insertData);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserRole();
