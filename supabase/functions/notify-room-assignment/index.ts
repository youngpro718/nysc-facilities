
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get unprocessed notifications
    const { data: notifications, error: notificationError } = await supabase
      .from('notifications')
      .select(`
        *,
        profiles:recipient_id (email, first_name, last_name)
      `)
      .eq('type', 'room_assignment_approved')
      .is('processed_at', null)
      .limit(10)

    if (notificationError) throw notificationError

    // Process each notification
    for (const notification of notifications || []) {
      if (!notification.profiles?.email) continue

      // Send email
      await resend.emails.send({
        from: 'Facilities Management <onboarding@resend.dev>',
        to: [notification.profiles.email],
        subject: 'Room Assignment Approved',
        html: `
          <h1>Room Assignment Approved</h1>
          <p>Dear ${notification.profiles.first_name},</p>
          <p>Your room assignment has been approved.</p>
          <p>Start Date: ${new Date(notification.data.start_date).toLocaleDateString()}</p>
          ${notification.data.end_date ? 
            `<p>End Date: ${new Date(notification.data.end_date).toLocaleDateString()}</p>` 
            : ''
          }
        `
      })

      // Mark notification as processed
      await supabase
        .from('notifications')
        .update({ processed_at: new Date().toISOString() })
        .eq('id', notification.id)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error processing notifications:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
