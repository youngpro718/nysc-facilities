import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KeyOrderUpdateRequest {
  orderId: string;
  newStatus: string;
  userId: string;
  userEmail: string;
  userProfile: {
    first_name: string;
    last_name: string;
  };
  notes?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { orderId, newStatus, userId, userEmail, userProfile, notes }: KeyOrderUpdateRequest = await req.json();

    console.log('Processing key order update:', { orderId, newStatus, userId });

    // Create user notification based on status
    let notificationType: string;
    let notificationTitle: string;
    let notificationMessage: string;
    let urgency: string;

    switch (newStatus) {
      case 'in_progress':
        notificationType = 'key_order_update';
        notificationTitle = 'Key Order In Progress';
        notificationMessage = 'Your key order is now being processed by our facilities team.';
        urgency = 'medium';
        break;
      case 'ready_for_pickup':
        notificationType = 'key_request_fulfilled';
        notificationTitle = 'Key Ready for Pickup';
        notificationMessage = 'Your key is ready for pickup at the facilities office. Please bring your ID for verification.';
        urgency = 'high';
        break;
      case 'completed':
        notificationType = 'key_order_update';
        notificationTitle = 'Key Order Completed';
        notificationMessage = 'Your key order has been completed successfully. Thank you for using our facilities management system.';
        urgency = 'low';
        break;
      default:
        notificationType = 'key_order_update';
        notificationTitle = 'Key Order Updated';
        notificationMessage = `Your key order status has been updated to: ${newStatus}`;
        urgency = 'medium';
    }

    // Create notification in database
    const { error: notificationError } = await supabaseClient
      .from('user_notifications')
      .insert({
        user_id: userId,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        urgency: urgency,
        action_url: '/my-requests',
        metadata: {
          order_id: orderId,
          status: newStatus,
          notes: notes
        },
        related_id: orderId
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      throw new Error(`Failed to create notification: ${notificationError.message}`);
    }

    // Send email notification only for important status changes
    if (['ready_for_pickup', 'completed'].includes(newStatus)) {
      const emailSubject = newStatus === 'ready_for_pickup' 
        ? '🔑 Your Key is Ready for Pickup'
        : '✅ Key Order Completed';

      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">${notificationTitle}</h1>
          </div>
          
          <p>Dear ${userProfile.first_name} ${userProfile.last_name},</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-weight: 500;">${notificationMessage}</p>
          </div>
          
          ${newStatus === 'ready_for_pickup' ? `
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #92400e;">Pickup Instructions:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                <li>Visit the facilities office during business hours</li>
                <li>Bring a valid photo ID for verification</li>
                <li>Office hours: Monday-Friday, 8:00 AM - 5:00 PM</li>
                <li>Location: Main building, first floor</li>
              </ul>
            </div>
          ` : ''}
          
          ${notes ? `
            <div style="margin: 20px 0;">
              <h3 style="color: #374151;">Additional Notes:</h3>
              <p style="background-color: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
                ${notes}
              </p>
            </div>
          ` : ''}
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="/my-requests" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: 500;">
              View My Requests
            </a>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            This is an automated notification from Facilities Management.<br>
            Please do not reply to this email.
          </p>
        </div>
      `;

      const emailResponse = await resend.emails.send({
        from: "Facilities Management <noreply@facilities.gov>",
        to: [userEmail],
        subject: emailSubject,
        html: emailBody,
      });

      console.log("Email sent successfully:", emailResponse);
    }

    console.log("Key order notification processed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        notificationCreated: true,
        emailSent: ['ready_for_pickup', 'completed'].includes(newStatus)
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-key-order-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});