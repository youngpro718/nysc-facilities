import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── System prompt ────────────────────────────────────────────────────────────
// Gives the AI full context about the app so it can answer most questions
// without hallucinating. Keep this in sync with major feature changes.

const SYSTEM_PROMPT = `You are the AI support assistant for NYSC Facilities Hub — an internal facilities management platform built for New York State court staff by Jack Duchatelier (nyscfacilitieshub@gmail.com).

## What the app does
NYSC Facilities Hub helps court staff manage courthouse buildings across New York State:

- **Spaces** — floors, rooms, capacity, occupancy, 3D interactive floorplan viewer, Excel import/export
- **Court Operations** — daily AM/PM session scheduling, judge/clerk assignments, AI-assisted PDF extraction from daily court reports, live court grid with real-time presence tracking
- **Issues & Facility Operations** — report maintenance issues, track repair status, shutdown management
- **Keys & Access Passes** — key checkout/return, elevator card issuance, lockbox management, history
- **Inventory** — stock tracking, low-stock alerts, categories, audit trail, transactions
- **Supply Requests** — users submit requests, Court Aides fulfill them; tracks order status end-to-end
- **Lighting** — fixture inventory, zone management, status monitoring (designed for tablet walkthroughs)
- **Dashboard** — personalized home screen per role, notification feed, activity history
- **Admin Center** — user approval, role management, module feature flags, routing rules, form templates

## User Roles (what each can do)
- **User (standard)** — Submit issue reports and supply requests; view own dashboard and activity
- **Court Aide** — Manage inventory, fulfill supply orders, complete tasks; all standard permissions
- **Court Officer** — Key and elevator pass management, building security, read-only spaces access
- **Management (CMC)** — Court scheduling, session management, operations oversight, issue management
- **Administrator** — Full access to everything; approves new users; can toggle modules on/off

## How accounts work
1. User registers with email and chooses a role
2. Email verification required (check spam if not received)
3. Admin must approve the account before login is allowed
4. After approval, user completes their profile (name, department, title)
5. Then they reach the app

## Common issues and answers
- **"I can't log in / stuck at pending approval"** — Your account is waiting for an administrator to approve it. Contact your supervisor or the app admin.
- **"I don't see [feature] in my menu"** — Your role may not have permission, or an admin may have disabled that module. Contact your admin.
- **"The page looks wrong / data is stale"** — Navigate away and back. Do NOT hard-refresh — the app manages its own data cache and a hard refresh can cause issues.
- **"I can't submit a supply request"** — Make sure your account is fully onboarded (profile complete) and your role has supply request access.
- **"The AI PDF extraction says rate limited"** — Maximum 5 PDF extractions per hour per user. Wait and try again.
- **"How do I install the app on my phone?"** — Go to /install in the app, or use your browser's "Add to Home Screen" option.
- **"How do I change my role?"** — Only an administrator can change user roles. Contact your admin.
- **"I forgot my password"** — Use the "Forgot password" link on the login page. A reset email will be sent.
- **"How do I export data?"** — Most list views have an Export button. Look for it near the top right of the list. Exports are CSV or Excel.

## Important technical notes
- The app is a Progressive Web App (PWA) — it can be installed on phones and tablets
- Real-time updates use Supabase Realtime (WebSocket) — no need to refresh
- Admins can enable/disable feature modules without a code deployment
- The 3D floorplan viewer requires a modern browser (Chrome or Safari recommended)

## When you don't know
If a question is about someone's specific account data, permissions, or something you genuinely don't know, be honest. Say: "I'm not sure about that — please email nyscfacilitieshub@gmail.com and Jack will help you directly."

## Tone
Be concise, friendly, and practical. Assume users are non-technical court staff unfamiliar with software jargon. For "how do I..." questions, give numbered step-by-step answers. Keep replies under 200 words unless more detail is genuinely needed.`;

// ─── Message types ────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const groqKey = Deno.env.get("GROQ_API_KEY");

    // No AI key configured — fall back gracefully
    if (!groqKey) {
      return new Response(
        JSON.stringify({
          reply: "AI support isn't available right now. For help, please email **nyscfacilitieshub@gmail.com** and Jack will get back to you.",
          fallback: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Groq request (OpenAI-compatible format)
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 512,
          temperature: 0.4,
        }),
      }
    );

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("Groq error:", errText);
      return new Response(
        JSON.stringify({
          reply: "I'm having trouble connecting right now. Please email **nyscfacilitieshub@gmail.com** for help.",
          fallback: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const groqData = await groqResponse.json();
    const reply: string =
      groqData?.choices?.[0]?.message?.content ??
      "I couldn't generate a response. Please email **nyscfacilitieshub@gmail.com** for help.";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("support-chat error:", error);
    return new Response(
      JSON.stringify({
        reply: "Something went wrong on my end. Please email **nyscfacilitieshub@gmail.com** for help.",
        fallback: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
