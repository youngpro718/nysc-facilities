// Send supply order emails via Resend (through the Lovable connector gateway).
// Types: 'receipt' | 'fulfilled' | 'new_request_team'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL =
  Deno.env.get('APP_PUBLIC_URL') || 'https://nyscfhub.com';
// Resend requires a verified domain; onboarding@resend.dev works out-of-the-box.
const FROM_ADDRESS = Deno.env.get('SUPPLY_EMAIL_FROM') || 'NYSC Facilities <onboarding@resend.dev>';

type EmailType = 'receipt' | 'fulfilled' | 'new_request_team';

interface Payload {
  type: EmailType;
  requestId: string;
}

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function shell(title: string, inner: string) {
  return `<!doctype html><html><body style="margin:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827">
  <div style="max-width:560px;margin:24px auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;background:#0f172a;color:#ffffff">
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.8">NYSC Facilities Hub</div>
      <div style="font-size:18px;font-weight:600;margin-top:4px">${esc(title)}</div>
    </div>
    <div style="padding:24px">${inner}</div>
    <div style="padding:16px 24px;border-top:1px solid #e5e7eb;background:#f9fafb;font-size:12px;color:#6b7280">
      This is an automated message from NYSC Facilities Hub.
    </div>
  </div></body></html>`;
}

function itemsTable(items: Array<{ name: string; qty: number; notes?: string | null }>) {
  const rows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${esc(i.name)}${
          i.notes ? `<div style="font-size:12px;color:#6b7280">${esc(i.notes)}</div>` : ''
        }</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-variant-numeric:tabular-nums">${esc(i.qty)}</td>
        </tr>`,
    )
    .join('');
  return `<table style="width:100%;border-collapse:collapse;margin-top:12px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
    <thead><tr style="background:#f9fafb;text-align:left">
      <th style="padding:8px 12px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280">Item</th>
      <th style="padding:8px 12px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;text-align:right">Qty</th>
    </tr></thead>
    <tbody>${rows}</tbody></table>`;
}

async function sendEmail(to: string | string[], subject: string, html: string) {
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY missing');
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY missing');
  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  });
  const body = await res.text();
  if (!res.ok) {
    console.error(`Resend send failed [${res.status}]: ${body}`);
    throw new Error(`Resend send failed [${res.status}]: ${body}`);
  }
  return body;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { type, requestId } = (await req.json()) as Payload;
    if (!type || !requestId) {
      return new Response(JSON.stringify({ error: 'type and requestId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Load request + requester + items
    const { data: request, error: reqErr } = await admin
      .from('supply_requests')
      .select(
        'id, display_id, status, delivery_location, description, priority, created_at, requester_id, fulfillment_notes',
      )
      .eq('id', requestId)
      .single();
    if (reqErr || !request) throw new Error(reqErr?.message || 'request not found');

    const { data: requester } = await admin
      .from('profiles')
      .select('first_name, last_name, email, department')
      .eq('id', request.requester_id)
      .maybeSingle();

    const { data: rawItems } = await admin
      .from('supply_request_items')
      .select('quantity_requested, quantity_fulfilled, notes, inventory_items(name)')
      .eq('request_id', requestId);

    const items = (rawItems || []).map((r: any) => ({
      name: r.inventory_items?.name ?? 'Item',
      qty:
        type === 'fulfilled' && r.quantity_fulfilled != null
          ? r.quantity_fulfilled
          : r.quantity_requested ?? 0,
      notes: r.notes,
    }));

    const requesterName =
      [requester?.first_name, requester?.last_name].filter(Boolean).join(' ') ||
      requester?.email ||
      'Requester';
    const displayId = request.display_id || request.id.slice(0, 8);
    const appLink = `${APP_URL}/my-requests?focus=${request.id}`;

    if (type === 'receipt') {
      if (!requester?.email) {
        return new Response(JSON.stringify({ skipped: 'no requester email' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const html = shell(
        `Supply order received — #${displayId}`,
        `<p style="margin:0 0 12px">Hi ${esc(requester.first_name || 'there')},</p>
         <p style="margin:0 0 12px">We received your supply order. Here's your receipt:</p>
         ${itemsTable(items)}
         <p style="margin:16px 0 4px"><strong>Delivery location:</strong> ${esc(request.delivery_location || '—')}</p>
         <p style="margin:0 0 4px"><strong>Priority:</strong> ${esc(request.priority || 'medium')}</p>
         <p style="margin:0 0 16px"><strong>Status:</strong> ${esc(request.status)}</p>
         <p style="margin:16px 0"><a href="${esc(appLink)}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:10px 16px;border-radius:8px;text-decoration:none">Track your order</a></p>
         <p style="margin:0;font-size:12px;color:#6b7280">You'll get another email when your order is ready or has been fulfilled.</p>`,
      );
      await sendEmail(requester.email, `Order received — #${displayId}`, html);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'fulfilled') {
      if (!requester?.email) {
        return new Response(JSON.stringify({ skipped: 'no requester email' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const isReady = request.status === 'ready';
      const headline = isReady
        ? `Your order is ready for pickup — #${displayId}`
        : `Your order has been fulfilled — #${displayId}`;
      const body = isReady
        ? `Your supply order is packed and ready for pickup at <strong>${esc(request.delivery_location || 'the supply room')}</strong>.`
        : `Your supply order has been fulfilled. Thanks!`;
      const html = shell(
        headline,
        `<p style="margin:0 0 12px">Hi ${esc(requester.first_name || 'there')},</p>
         <p style="margin:0 0 12px">${body}</p>
         ${itemsTable(items)}
         ${
           request.fulfillment_notes
             ? `<p style="margin:16px 0 0"><strong>Notes from supply:</strong> ${esc(request.fulfillment_notes)}</p>`
             : ''
         }
         <p style="margin:16px 0"><a href="${esc(appLink)}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:10px 16px;border-radius:8px;text-decoration:none">Open in app</a></p>`,
      );
      await sendEmail(requester.email, headline, html);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'new_request_team') {
      const { data: settings } = await admin
        .from('supply_email_settings')
        .select('supply_team_notifications_enabled, supply_team_recipients')
        .eq('id', true)
        .maybeSingle();
      if (!settings?.supply_team_notifications_enabled) {
        return new Response(JSON.stringify({ skipped: 'team notifications disabled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const recipients = (settings.supply_team_recipients || []).filter(Boolean);
      if (recipients.length === 0) {
        return new Response(JSON.stringify({ skipped: 'no recipients' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const adminLink = `${APP_URL}/admin/supply-requests`;
      const html = shell(
        `New supply request — #${displayId}`,
        `<p style="margin:0 0 12px">A new supply order has been submitted.</p>
         <p style="margin:0 0 4px"><strong>From:</strong> ${esc(requesterName)}${
          requester?.department ? ` (${esc(requester.department)})` : ''
        }</p>
         <p style="margin:0 0 4px"><strong>Delivery location:</strong> ${esc(request.delivery_location || '—')}</p>
         <p style="margin:0 0 4px"><strong>Priority:</strong> ${esc(request.priority || 'medium')}</p>
         <p style="margin:0 0 4px"><strong>Status:</strong> ${esc(request.status)}</p>
         ${itemsTable(items)}
         <p style="margin:16px 0"><a href="${esc(adminLink)}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:10px 16px;border-radius:8px;text-decoration:none">Open in Facilities Hub</a></p>`,
      );
      await sendEmail(recipients, `New supply request — #${displayId}`, html);
      return new Response(JSON.stringify({ ok: true, recipients: recipients.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `unknown type: ${type}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-supply-email error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
