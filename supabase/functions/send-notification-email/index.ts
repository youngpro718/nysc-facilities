// Sends a plain-text/HTML email for a `user_notifications` row via Resend.
// Invoked by a DB trigger (pg_net.http_post) whenever a notification is
// inserted for a user whose profile.user_settings.email_notifications is
// enabled. This is a fire-and-forget notification email — the in-app toast
// and desktop notification remain the primary delivery channels.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const APP_URL = Deno.env.get("APP_URL") ?? "https://nyscfhub.com";
const FROM_EMAIL =
  Deno.env.get("FROM_EMAIL") ?? "NYSC Facilities Hub <onboarding@resend.dev>";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  notification_id?: string;
  user_id?: string;
  title?: string;
  message?: string;
  action_url?: string | null;
  urgency?: string | null;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function html(title: string, message: string, url: string | null): string {
  const linkBlock = url
    ? `<p style="margin:24px 0;"><a href="${escape(url)}" style="background:#0f172a;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block;">Open in NYSC Facilities Hub</a></p>`
    : "";
  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f8fafc;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e2e8f0;">
<h2 style="margin:0 0 8px;font-size:18px;color:#0f172a;">${escape(title)}</h2>
<p style="margin:0;color:#334155;line-height:1.5;">${escape(message)}</p>
${linkBlock}
<p style="margin-top:24px;font-size:12px;color:#64748b;">You are receiving this because email notifications are enabled in your NYSC Facilities Hub profile. <a href="${APP_URL}/profile?tab=settings" style="color:#0f172a;">Manage preferences</a>.</p>
</div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const payload = (await req.json()) as Payload;
    const { notification_id, user_id, title, message, action_url } = payload;

    if (!user_id || !title || !message) {
      return new Response(
        JSON.stringify({ error: "user_id, title, and message are required" }),
        { status: 400, headers: { ...CORS, "content-type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: profile, error } = await admin
      .from("profiles")
      .select("email, first_name, last_name, user_settings")
      .eq("id", user_id)
      .maybeSingle();

    if (error) throw error;
    if (!profile?.email) {
      return new Response(
        JSON.stringify({ skipped: "no email on profile" }),
        { headers: { ...CORS, "content-type": "application/json" } },
      );
    }

    const settings = (profile.user_settings ?? {}) as {
      email_notifications?: boolean;
    };
    if (settings.email_notifications === false) {
      return new Response(
        JSON.stringify({ skipped: "email notifications disabled" }),
        { headers: { ...CORS, "content-type": "application/json" } },
      );
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...CORS, "content-type": "application/json" } },
      );
    }

    const absoluteUrl =
      action_url && action_url.startsWith("/")
        ? `${APP_URL}${action_url}`
        : action_url ?? null;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [profile.email],
        subject: title,
        html: html(title, message, absoluteUrl),
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error("resend error", resp.status, body);
      return new Response(
        JSON.stringify({ error: "resend failed", detail: body }),
        { status: 502, headers: { ...CORS, "content-type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, notification_id }),
      { headers: { ...CORS, "content-type": "application/json" } },
    );
  } catch (err) {
    console.error("send-notification-email failed", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "unknown" }),
      { status: 500, headers: { ...CORS, "content-type": "application/json" } },
    );
  }
});
