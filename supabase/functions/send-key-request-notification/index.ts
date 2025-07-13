import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  to: string;
  request: {
    id: string;
    reason: string;
    request_type: string;
    room_id?: string;
    room_other?: string;
    quantity: number;
    profiles: {
      first_name: string;
      last_name: string;
      user_id: string;
    };
    rooms?: {
      name: string;
      room_number: string;
    };
  };
  status: 'approved' | 'rejected';
  admin_notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { to, request, status, admin_notes }: NotificationRequest = await req.json();

    // Get the user_id from the request data
    const userId = request.profiles.user_id;
    if (!userId) {
      throw new Error('User ID is required to create notification');
    }

    // Create user notification in database
    const notificationType = status === 'approved' ? 'key_request_approved' : 'key_request_denied';
    const notificationTitle = status === 'approved' 
      ? 'Key Request Approved' 
      : 'Key Request Denied';
    
    const roomInfo = request.rooms 
      ? `${request.rooms.room_number} - ${request.rooms.name}`
      : request.room_other || 'unspecified room';

    const notificationMessage = status === 'approved'
      ? `Your ${request.request_type} key request for ${roomInfo} has been approved. The key ordering process will begin shortly.`
      : `Your ${request.request_type} key request for ${roomInfo} has been denied. ${admin_notes ? `Reason: ${admin_notes}` : ''}`;

    // Create notification in database
    const { error: notificationError } = await supabaseClient
      .from('user_notifications')
      .insert({
        user_id: userId,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        urgency: status === 'approved' ? 'medium' : 'high',
        action_url: '/my-requests',
        metadata: {
          request_id: request.id,
          request_type: request.request_type,
          room_info: roomInfo,
          admin_notes: admin_notes
        },
        related_id: request.id
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      throw new Error(`Failed to create notification: ${notificationError.message}`);
    }

    // If approved, create a key order and update status to processing
    if (status === 'approved') {
      console.log(`Creating key order for approved request ${request.id}`);
      
      // Create a simple key order record (this could be expanded into a full ordering system)
      const { error: orderError } = await supabaseClient
        .from('key_orders')
        .insert({
          request_id: request.id,
          user_id: userId,
          request_type: request.request_type,
          room_id: request.room_id,
          room_other: request.room_other,
          quantity: request.quantity,
          status: 'pending_fulfillment',
          notes: `Auto-created from approved request: ${request.reason}`
        });

      if (orderError) {
        console.error('Error creating key order:', orderError);
        // Don't throw here as the main notification was successful
      } else {
        console.log('Key order created successfully');
      }
    }

    // Send email notification
    const emailSubject = status === 'approved' 
      ? `✅ Key Request Approved - ${request.request_type} key`
      : `❌ Key Request Denied - ${request.request_type} key`;

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${status === 'approved' ? '#22c55e' : '#ef4444'};">
          ${notificationTitle}
        </h2>
        
        <p>Dear ${request.profiles.first_name} ${request.profiles.last_name},</p>
        
        <p>Your key request has been <strong>${status}</strong>.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Request Details:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Type:</strong> ${request.request_type} key</li>
            <li><strong>Room:</strong> ${roomInfo}</li>
            <li><strong>Quantity:</strong> ${request.quantity} key(s)</li>
            <li><strong>Reason:</strong> ${request.reason}</li>
          </ul>
        </div>
        
        ${admin_notes ? `
          <div style="background-color: ${status === 'approved' ? '#ecfdf5' : '#fef2f2'}; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: ${status === 'approved' ? '#166534' : '#991b1b'};">
              ${status === 'approved' ? 'Notes:' : 'Reason for denial:'}
            </h4>
            <p style="margin: 0;">${admin_notes}</p>
          </div>
        ` : ''}
        
        ${status === 'approved' ? `
          <p>The key ordering process will begin shortly. You will receive another notification once your key is ready for pickup.</p>
        ` : `
          <p>If you believe this decision was made in error, please contact the administrator for further clarification.</p>
        `}
        
        <p>You can view your requests anytime by logging into your dashboard.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated notification. Please do not reply to this email.
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Facilities Management <noreply@facilities.gov>",
      to: [to],
      subject: emailSubject,
      html: emailBody,
    });

    console.log("Email sent successfully:", emailResponse);
    console.log("User notification created successfully");

    return new Response(
      JSON.stringify({
        success: true,
        emailResponse,
        notification: notificationMessage
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-key-request-notification function:", error);
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