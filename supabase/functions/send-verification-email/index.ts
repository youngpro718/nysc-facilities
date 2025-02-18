
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'welcome' | 'approved' | 'rejected' | 'admin_notification';
  userId: string;
  adminNotes?: string;
}

async function getUserProfile(userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, departments(*)')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return profile;
}

async function getAdminEmails() {
  const { data: adminRoles, error } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');

  if (error) throw error;

  const adminIds = adminRoles.map(role => role.user_id);
  const { data: adminProfiles, error: profileError } = await supabase
    .from('profiles')
    .select('email')
    .in('id', adminIds);

  if (profileError) throw profileError;
  return adminProfiles.map(profile => profile.email).filter(Boolean);
}

const handler = async (req: Request): Promise<Response> => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const { type, userId, adminNotes }: EmailRequest = await req.json();
    const profile = await getUserProfile(userId);
    
    let emailData;
    
    switch (type) {
      case 'welcome':
        emailData = {
          to: profile.email,
          subject: "Welcome to NYSC Facilities Hub - Account Verification Pending",
          html: `
            <h1>Welcome to NYSC Facilities Hub, ${profile.first_name}!</h1>
            <p>Thank you for registering. Your account is currently pending verification by our administrators.</p>
            <p>We will notify you once your account has been verified.</p>
            <p>Your registration details:</p>
            <ul>
              <li>Name: ${profile.first_name} ${profile.last_name}</li>
              <li>Department: ${profile.departments?.name || 'Not specified'}</li>
              <li>Title: ${profile.title || 'Not specified'}</li>
            </ul>
            <p>If you have any questions, please contact our support team.</p>
          `
        };
        break;

      case 'approved':
        emailData = {
          to: profile.email,
          subject: "NYSC Facilities Hub - Account Verified",
          html: `
            <h1>Account Verified</h1>
            <p>Dear ${profile.first_name},</p>
            <p>Your NYSC Facilities Hub account has been verified. You can now log in to access the system.</p>
            <p>Thank you for your patience during the verification process.</p>
            <p><a href="${supabaseUrl}">Click here to log in</a></p>
          `
        };
        break;

      case 'rejected':
        emailData = {
          to: profile.email,
          subject: "NYSC Facilities Hub - Account Verification Update",
          html: `
            <h1>Account Verification Update</h1>
            <p>Dear ${profile.first_name},</p>
            <p>We regret to inform you that your account verification request has been declined.</p>
            ${adminNotes ? `<p>Reason: ${adminNotes}</p>` : ''}
            <p>If you believe this is an error or would like to discuss this further, please contact our support team.</p>
          `
        };
        break;

      case 'admin_notification':
        const adminEmails = await getAdminEmails();
        emailData = {
          to: adminEmails,
          subject: "New Account Verification Request",
          html: `
            <h1>New Verification Request</h1>
            <p>A new user has registered and requires verification:</p>
            <ul>
              <li>Name: ${profile.first_name} ${profile.last_name}</li>
              <li>Email: ${profile.email}</li>
              <li>Department: ${profile.departments?.name || 'Not specified'}</li>
              <li>Title: ${profile.title || 'Not specified'}</li>
            </ul>
            <p><a href="${supabaseUrl}/auth/users">Click here to review the request</a></p>
          `
        };
        break;

      default:
        throw new Error('Invalid email type');
    }

    const emailResponse = await resend.emails.send({
      from: "NYSC Facilities Hub <onboarding@resend.dev>",
      ...emailData
    });

    console.log(`Email sent successfully for type ${type}:`, emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
