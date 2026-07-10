import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1";
import QRCode from "npm:qrcode@1.5.4";
import { crypto } from "jsr:@std/crypto";
import { encodeHex } from "jsr:@std/encoding/hex";

// ─── Origins ───────────────────────────────────────────────────────────────────
const DEFAULT_ALLOWED_ORIGINS = [
  "https://nyscfhub.com",
  "https://www.nyscfhub.com",
  "https://nysc-facilities.lovable.app",
  "https://id-preview--e785d8ca-c2d1-4fcc-af24-583a7e48eaa6.lovable.app",
  "https://e785d8ca-c2d1-4fcc-af24-583a7e48eaa6.lovableproject.com",
  "http://localhost:5173",
  "http://localhost:8080",
];

const configuredOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS;

function getCorsHeaders(req: Request): Record<string, string> {
  const base = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, x-supabase-api-version, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
  const origin = req.headers.get("Origin");
  if (origin && allowedOrigins.includes(origin)) {
    return { ...base, "Access-Control-Allow-Origin": origin };
  }
  return { ...base, "Access-Control-Allow-Origin": allowedOrigins[0] };
}

function originAllowed(req: Request): boolean {
  const origin = req.headers.get("Origin");
  if (!origin) return true;
  return allowedOrigins.includes(origin);
}

// ─── Configuration ─────────────────────────────────────────────────────────────
const APP_URL = Deno.env.get("APP_URL") ?? "https://nyscfhub.com";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "NYSC Facilities Hub <notifications@nyscfhub.com>";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface RequestItem {
  name: string;
  quantity_requested: number;
  quantity_approved: number | null;
  quantity_fulfilled: number | null;
  unit: string | null;
}

interface Requester {
  email: string;
  first_name: string | null;
  last_name: string | null;
  department: string | null;
}

interface SupplyRequest {
  id: string;
  requester_id: string;
  display_id: string | null;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  approved_at: string | null;
  ready_for_delivery_at: string | null;
  fulfilled_at: string | null;
  delivery_location: string | null;
  justification: string | null;
  description: string | null;
  fulfilled_by: string | null;
}

interface StatusHistoryRow {
  status: string;
  changed_at: string;
}

interface EmailPayload {
  type: "receipt" | "fulfilled" | "new_request_team" | "team_test";
  requestId?: string;
}

interface ResendEmailDetails {
  id?: string;
  message_id?: string | null;
  last_event?: string | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Unknown error");
  }
  return "Unknown error";
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

function formatName(p: Requester): string {
  const parts = [p.first_name, p.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : p.email;
}

function formatRequestId(request: SupplyRequest): string {
  if (request.display_id) return request.display_id;
  const short = request.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `REQ-${short}`;
}

function getReceiptTitle(type: "receipt" | "fulfilled"): string {
  return type === "receipt" ? "Order Confirmation" : "Pickup Receipt";
}

function getStatusDisplay(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeRecipients(recipients: unknown): string[] {
  if (!Array.isArray(recipients)) return [];
  return Array.from(
    new Set(
      recipients
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.includes("@")),
    ),
  );
}

async function fetchResendEmailDetails(resendKey: string, emailId: string): Promise<ResendEmailDetails | null> {
  try {
    const response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(emailId)}`, {
      headers: { "Authorization": `Bearer ${resendKey}` },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch Resend email details", { emailId, error });
    return null;
  }
}

async function recordEmailDeliveries(
  supabase: ReturnType<typeof createClient>,
  details: {
    requestId: string | null;
    emailType: EmailPayload["type"];
    recipients: string[];
    sender: string;
    subject: string;
    providerEmailId?: string | null;
    providerMessageId?: string | null;
    status: string;
    errorDetail?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const now = new Date().toISOString();
  const rows = details.recipients.map((recipient) => ({
    request_id: details.requestId,
    email_type: details.emailType,
    recipient,
    sender: details.sender,
    subject: details.subject,
    provider: "resend",
    provider_email_id: details.providerEmailId ?? null,
    provider_message_id: details.providerMessageId ?? null,
    status: details.status,
    error_detail: details.errorDetail ?? null,
    metadata: details.metadata ?? {},
    sent_at: ["sent", "delivered", "delivery_delayed"].includes(details.status) ? now : null,
    delivered_at: details.status === "delivered" ? now : null,
  }));

  if (rows.length === 0) return;

  const { error } = await supabase.from("supply_email_deliveries").insert(rows);
  if (error) {
    console.error("Failed to record supply email deliveries", {
      message: getErrorMessage(error),
      recipients: details.recipients,
      emailType: details.emailType,
    });
  }
}

async function userCanSendTeamTest(supabase: ReturnType<typeof createClient>, userId: string): Promise<boolean> {
  const allowedRoles = ["admin", "facilities_manager", "purchasing", "purchasing_staff", "supply_room_staff"];
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", allowedRoles);

  if (error) {
    console.error("Failed to check supply email test permissions", error);
    return false;
  }
  return (data ?? []).length > 0;
}

// ─── Signed deep link ──────────────────────────────────────────────────────────
async function signRequestId(requestId: string): Promise<string> {
  const secret = Deno.env.get("RECEIPT_LINK_SECRET");
  if (!secret) throw new Error("RECEIPT_LINK_SECRET not configured");
  const data = new TextEncoder().encode(requestId);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return encodeHex(sig).slice(0, 16);
}

async function makeDeepLink(requestId: string): Promise<string> {
  const sig = await signRequestId(requestId);
  return `${APP_URL}/my-supply-requests?open=${encodeURIComponent(requestId)}&sig=${sig}`;
}

async function verifyDeepLink(requestId: string, sig: string): Promise<boolean> {
  const secret = Deno.env.get("RECEIPT_LINK_SECRET");
  if (!secret) return false;
  try {
    const expected = await signRequestId(requestId);
    return expected === sig;
  } catch {
    return false;
  }
}

// ─── PDF generation ───────────────────────────────────────────────────────────
async function generateReceiptPdf(
  type: "receipt" | "fulfilled",
  request: SupplyRequest,
  requester: Requester,
  items: RequestItem[],
  history: StatusHistoryRow[],
  completedBy: string | null
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]); // US Letter
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;
  const helvetica = await pdf.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const primary = rgb(0.23, 0.51, 0.96); // blue-500-ish
  const dark = rgb(0.1, 0.1, 0.1);
  const muted = rgb(0.45, 0.45, 0.45);
  const lightGray = rgb(0.95, 0.95, 0.95);

  const deepLink = await makeDeepLink(request.id);
  const qrDataUrl = await QRCode.toDataURL(deepLink, { width: 120, margin: 1 });
  const qrImage = await pdf.embedPng(qrDataUrl);

  // Header
  page.drawText("NYSC Facilities Hub", {
    x: margin,
    y,
    size: 22,
    font: helveticaBold,
    color: primary,
  });
  y -= 28;

  page.drawText(getReceiptTitle(type), {
    x: margin,
    y,
    size: 16,
    font: helveticaBold,
    color: dark,
  });
  y -= 20;

  page.drawText("Supply Request System", {
    x: margin,
    y,
    size: 10,
    font: helvetica,
    color: muted,
  });
  y -= 50;

  // QR code
  page.drawImage(qrImage, {
    x: width - margin - 120,
    y: height - margin - 120,
    width: 120,
    height: 120,
  });

  // Receipt meta
  const metaY = height - margin - 120;
  page.drawText(formatRequestId(request), {
    x: width - margin - 120,
    y: metaY - 18,
    size: 9,
    font: helveticaBold,
    color: dark,
  });
  page.drawText(formatDateTime(new Date().toISOString()), {
    x: width - margin - 120,
    y: metaY - 32,
    size: 8,
    font: helvetica,
    color: muted,
  });

  // Two-column info
  const col1 = margin;
  const col2 = width / 2 + 10;

  page.drawText("REQUESTER INFORMATION", {
    x: col1,
    y,
    size: 9,
    font: helveticaBold,
    color: muted,
  });
  page.drawText("ORDER DETAILS", {
    x: col2,
    y,
    size: 9,
    font: helveticaBold,
    color: muted,
  });
  y -= 18;

  page.drawText(formatName(requester), {
    x: col1,
    y,
    size: 11,
    font: helveticaBold,
    color: dark,
  });
  y -= 14;

  page.drawText(requester.email ?? "", {
    x: col1,
    y,
    size: 9,
    font: helvetica,
    color: dark,
  });
  y -= 13;

  page.drawText(requester.department ?? "", {
    x: col1,
    y,
    size: 9,
    font: helvetica,
    color: dark,
  });

  let dy = y - 20; // right column tracker
  const rightRows: [string, string][] = [
    ["Request ID:", formatRequestId(request)],
    ["Title:", request.title],
    ["Priority:", request.priority.toUpperCase()],
    ["Status:", getStatusDisplay(request.status)],
  ];
  if (request.delivery_location) {
    rightRows.push(["Deliver to:", request.delivery_location]);
  }
  for (const [label, value] of rightRows) {
    page.drawText(label, {
      x: col2,
      y: dy,
      size: 9,
      font: helvetica,
      color: muted,
    });
    page.drawText(value, {
      x: col2 + 80,
      y: dy,
      size: 9,
      font: helveticaBold,
      color: dark,
    });
    dy -= 14;
  }

  y = Math.min(y - 10, dy) - 30;

  // Items table
  page.drawText("ITEMS", {
    x: margin,
    y,
    size: 9,
    font: helveticaBold,
    color: muted,
  });
  y -= 18;

  const rowHeight = 22;
  const tableTop = y;
  const cols = {
    item: { x: margin, w: 260 },
    requested: { x: margin + 260, w: 60 },
    approved: { x: margin + 320, w: 60 },
    fulfilled: { x: margin + 380, w: 60 },
    unit: { x: margin + 440, w: 72 },
  };

  // Table header
  page.drawRectangle({
    x: margin,
    y: y - rowHeight + 4,
    width: width - margin * 2,
    height: rowHeight,
    color: lightGray,
  });

  page.drawText("Item", { x: cols.item.x + 4, y: y - 12, size: 9, font: helveticaBold, color: dark });
  page.drawText("Requested", { x: cols.requested.x + 4, y: y - 12, size: 9, font: helveticaBold, color: dark });
  page.drawText("Approved", { x: cols.approved.x + 4, y: y - 12, size: 9, font: helveticaBold, color: dark });
  page.drawText("Fulfilled", { x: cols.fulfilled.x + 4, y: y - 12, size: 9, font: helveticaBold, color: dark });
  page.drawText("Unit", { x: cols.unit.x + 4, y: y - 12, size: 9, font: helveticaBold, color: dark });
  y -= rowHeight;

  // Table rows
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i > 0) {
      page.drawLine({
        start: { x: margin, y: y + 4 },
        end: { x: width - margin, y: y + 4 },
        thickness: 0.5,
        color: lightGray,
      });
    }
    page.drawText(item.name, { x: cols.item.x + 4, y: y - 12, size: 9, font: helvetica, color: dark });
    page.drawText(String(item.quantity_requested), { x: cols.requested.x + 30, y: y - 12, size: 9, font: helvetica, color: dark });
    page.drawText(String(item.quantity_approved ?? item.quantity_requested), { x: cols.approved.x + 30, y: y - 12, size: 9, font: helvetica, color: dark });
    page.drawText(String(item.quantity_fulfilled ?? item.quantity_approved ?? item.quantity_requested), { x: cols.fulfilled.x + 30, y: y - 12, size: 9, font: helvetica, color: dark });
    page.drawText(item.unit ?? "ea", { x: cols.unit.x + 4, y: y - 12, size: 9, font: helvetica, color: dark });
    y -= rowHeight;
  }

  // Table border
  page.drawRectangle({
    x: margin,
    y: y + 4,
    width: width - margin * 2,
    height: tableTop - y,
    borderColor: muted,
    borderWidth: 0.5,
  });

  y -= 30;

  // Timeline
  if (y > 140) {
    page.drawText("TIMELINE", { x: margin, y, size: 9, font: helveticaBold, color: muted });
    y -= 18;

    const timelineRows: [string, string | null][] = [
      ["Submitted:", request.created_at],
      ["Approved:", request.approved_at],
      ["Ready for Pickup:", request.ready_for_delivery_at],
      ["Completed:", request.fulfilled_at],
    ];
    for (const [label, value] of timelineRows) {
      if (!value) continue;
      page.drawText(label, { x: margin, y, size: 9, font: helvetica, color: muted });
      page.drawText(formatDateTime(value), { x: margin + 110, y, size: 9, font: helveticaBold, color: dark });
      y -= 14;
    }
  }

  // Notes
  if (request.justification && y > 100) {
    y -= 10;
    page.drawText("NOTES", { x: margin, y, size: 9, font: helveticaBold, color: muted });
    y -= 16;
    page.drawText(request.justification, {
      x: margin,
      y,
      size: 9,
      font: helvetica,
      color: dark,
      maxWidth: width - margin * 2,
    });
  }

  // Footer
  page.drawText("Scan the QR code to view this request in your dashboard.", {
    x: margin,
    y: 50,
    size: 8,
    font: helvetica,
    color: muted,
  });

  if (completedBy) {
    page.drawText(`Completed by: ${completedBy}`, {
      x: width - margin,
      y: 50,
      size: 8,
      font: helvetica,
      color: muted,
      maxWidth: 200,
    });
  }

  return await pdf.save();
}

// ─── Data fetching ─────────────────────────────────────────────────────────────
async function fetchRequestData(supabase: ReturnType<typeof createClient>, requestId: string) {
  if (!isUuid(requestId)) {
    throw new Error("Invalid request id");
  }

  const { data: request, error: requestError } = await supabase
    .from("supply_requests")
    .select(
      "id, requester_id, display_id, title, status, priority, created_at, approved_at, ready_for_delivery_at, fulfilled_at, delivery_location, justification, description, fulfilled_by"
    )
    .eq("id", requestId)
    .single();
  if (requestError || !request) throw new Error("Request not found");

  let requester: { email: string | null; first_name: string | null; last_name: string | null; department: string | null } | null = null;
  if (isUuid(request.requester_id)) {
    const { data, error: requesterError } = await supabase
      .from("profiles")
      .select("email, first_name, last_name, department")
      .eq("id", request.requester_id)
      .maybeSingle();
    if (requesterError) throw requesterError;
    requester = data ?? null;
  }

  const { data: items, error: itemsError } = await supabase
    .from("supply_request_items")
    .select("quantity_requested, quantity_approved, quantity_fulfilled, inventory_items(name, unit)")
    .eq("request_id", requestId);
  if (itemsError) throw itemsError;

  const { data: history, error: historyError } = await supabase
    .from("supply_request_status_history")
    .select("status, changed_at")
    .eq("request_id", requestId)
    .order("changed_at", { ascending: true });
  if (historyError) throw historyError;

  let fulfiller: { first_name: string | null; last_name: string | null } | null = null;
  if (isUuid(request.fulfilled_by)) {
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", request.fulfilled_by)
      .maybeSingle();
    fulfiller = data ?? null;
  }

  let completedBy = null;
  if (fulfiller) {
    completedBy = [fulfiller.first_name, fulfiller.last_name].filter(Boolean).join(" ");
  }

  const typedItems: RequestItem[] = (items || []).map((it: any) => ({
    name: it.inventory_items?.name ?? "Unknown item",
    quantity_requested: it.quantity_requested ?? 0,
    quantity_approved: it.quantity_approved ?? null,
    quantity_fulfilled: it.quantity_fulfilled ?? null,
    unit: it.inventory_items?.unit ?? null,
  }));

  const typedHistory: StatusHistoryRow[] = (history || []).map((h: any) => ({
    status: h.status,
    changed_at: h.changed_at,
  }));

  return {
    request: request as SupplyRequest,
    requester: (requester ?? {
      email: "",
      first_name: null,
      last_name: null,
      department: null,
    }) as Requester,
    items: typedItems,
    history: typedHistory,
    completedBy,
  };
}

// ─── Service client ────────────────────────────────────────────────────────────
function getServiceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Server configuration error: Supabase service credentials are missing");
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// ─── Email sending ─────────────────────────────────────────────────────────────
async function sendReceiptEmail(
  type: "receipt" | "fulfilled",
  request: SupplyRequest,
  requester: Requester,
  items: RequestItem[],
  history: StatusHistoryRow[],
  completedBy: string | null
) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) throw new Error("RESEND_API_KEY not configured");

  const supabase = getServiceClient();
  const recipients = normalizeRecipients([requester.email]);
  if (recipients.length === 0) throw new Error("Requester has no valid email");

  const pdf = await generateReceiptPdf(type, request, requester, items, history, completedBy);
  const base64 = btoa(String.fromCharCode(...pdf));
  const filename = type === "receipt"
    ? `Receipt-${formatRequestId(request)}.pdf`
    : `Pickup-${formatRequestId(request)}.pdf`;

  const subject = type === "receipt"
    ? `Receipt for supply request ${formatRequestId(request)}`
    : `Your supply request ${formatRequestId(request)} is ready for pickup`;

  const deepLink = await makeDeepLink(request.id);
  const html = type === "receipt"
    ? receiptHtml(request, requester, deepLink)
    : fulfilledHtml(request, requester, deepLink, completedBy);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: recipients,
      subject,
      html,
      attachments: [
        { filename, content: base64 },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    await recordEmailDeliveries(supabase, {
      requestId: request.id,
      emailType: type,
      recipients,
      sender: FROM_EMAIL,
      subject,
      status: "failed",
      errorDetail: `Resend error ${response.status}: ${text}`,
      metadata: { displayId: formatRequestId(request) },
    });
    throw new Error(`Resend error ${response.status}: ${text}`);
  }

  const result = await response.json();
  const providerEmailId = typeof result?.id === "string" ? result.id : null;
  const providerDetails = providerEmailId ? await fetchResendEmailDetails(resendKey, providerEmailId) : null;
  const status = providerDetails?.last_event ?? "sent";

  await recordEmailDeliveries(supabase, {
    requestId: request.id,
    emailType: type,
    recipients,
    sender: FROM_EMAIL,
    subject,
    providerEmailId,
    providerMessageId: providerDetails?.message_id ?? null,
    status,
    metadata: { displayId: formatRequestId(request), attachment: filename },
  });

  return { ...result, last_event: status, message_id: providerDetails?.message_id ?? null };
}

async function sendTeamAlert(request: SupplyRequest, requester: Requester) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) throw new Error("RESEND_API_KEY not configured");

  const supabase = getServiceClient();
  const { data: settings, error: settingsError } = await supabase
    .from("supply_email_settings")
    .select("supply_team_notifications_enabled, supply_team_recipients")
    .eq("id", true)
    .maybeSingle();

  if (settingsError) throw settingsError;
  if (!settings?.supply_team_notifications_enabled) return { skipped: true };

  const recipients = normalizeRecipients(settings.supply_team_recipients || []);
  if (recipients.length === 0) return { skipped: true };

  console.log("send-supply-email team alert recipients", {
    requestId: request.id,
    displayId: formatRequestId(request),
    recipients,
    from: FROM_EMAIL,
  });

  const deepLink = `${APP_URL}/admin/supply-requests?id=${encodeURIComponent(request.id)}`;
  const html = teamAlertHtml(request, requester, deepLink);
  const subject = `New supply request: ${formatRequestId(request)} — ${request.title}`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: recipients,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    await recordEmailDeliveries(supabase, {
      requestId: request.id,
      emailType: "new_request_team",
      recipients,
      sender: FROM_EMAIL,
      subject,
      status: "failed",
      errorDetail: `Resend error ${response.status}: ${text}`,
      metadata: { displayId: formatRequestId(request) },
    });
    throw new Error(`Resend error ${response.status}: ${text}`);
  }

  const result = await response.json();
  const providerEmailId = typeof result?.id === "string" ? result.id : null;
  const providerDetails = providerEmailId ? await fetchResendEmailDetails(resendKey, providerEmailId) : null;
  const status = providerDetails?.last_event ?? "sent";

  await recordEmailDeliveries(supabase, {
    requestId: request.id,
    emailType: "new_request_team",
    recipients,
    sender: FROM_EMAIL,
    subject,
    providerEmailId,
    providerMessageId: providerDetails?.message_id ?? null,
    status,
    metadata: { displayId: formatRequestId(request) },
  });

  console.log("send-supply-email team alert sent", {
    requestId: request.id,
    displayId: formatRequestId(request),
    recipients,
    result: { ...result, last_event: status, message_id: providerDetails?.message_id ?? null },
  });
  return { ...result, last_event: status, message_id: providerDetails?.message_id ?? null };
}

async function sendTeamTestEmail() {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) throw new Error("RESEND_API_KEY not configured");

  const supabase = getServiceClient();
  const { data: settings, error: settingsError } = await supabase
    .from("supply_email_settings")
    .select("supply_team_notifications_enabled, supply_team_recipients")
    .eq("id", true)
    .maybeSingle();

  if (settingsError) throw settingsError;
  const recipients = normalizeRecipients(settings?.supply_team_recipients || []);
  if (recipients.length === 0) return { skipped: true, reason: "No supply team recipients configured" };

  const subject = `NYSC Facilities Hub supply email test — ${formatDateTime(new Date().toISOString())}`;
  const html = `<!doctype html>
<html>
  <body style="font-family:Arial,sans-serif;max-width:600px;margin:24px auto;color:#111;">
    <h2 style="color:#2563eb;">NYSC Facilities Hub</h2>
    <h1>Supply email test</h1>
    <p>This confirms supply team email alerts are sending from <strong>${escapeHtml(FROM_EMAIL)}</strong>.</p>
    <p><strong>Recipients:</strong> ${escapeHtml(recipients.join(", "))}</p>
    <p><a href="${APP_URL}/admin/supply-requests" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Open supply requests</a></p>
  </body>
</html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: recipients,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    await recordEmailDeliveries(supabase, {
      requestId: null,
      emailType: "team_test",
      recipients,
      sender: FROM_EMAIL,
      subject,
      status: "failed",
      errorDetail: `Resend error ${response.status}: ${text}`,
    });
    throw new Error(`Resend error ${response.status}: ${text}`);
  }

  const result = await response.json();
  const providerEmailId = typeof result?.id === "string" ? result.id : null;
  const providerDetails = providerEmailId ? await fetchResendEmailDetails(resendKey, providerEmailId) : null;
  const status = providerDetails?.last_event ?? "sent";

  await recordEmailDeliveries(supabase, {
    requestId: null,
    emailType: "team_test",
    recipients,
    sender: FROM_EMAIL,
    subject,
    providerEmailId,
    providerMessageId: providerDetails?.message_id ?? null,
    status,
  });

  return { ...result, recipients, last_event: status, message_id: providerDetails?.message_id ?? null };
}

// ─── HTML templates ───────────────────────────────────────────────────────────
function receiptHtml(request: SupplyRequest, requester: Requester, deepLink: string): string {
  return `<!doctype html>
<html>
  <body style="font-family:Arial,sans-serif;max-width:600px;margin:24px auto;color:#111;">
    <h2 style="color:#2563eb;">NYSC Facilities Hub</h2>
    <h1>Order Confirmation</h1>
    <p>Hi ${formatName(requester)},</p>
    <p>Your supply request <strong>${formatRequestId(request)}</strong> has been received.</p>
    <p><strong>Title:</strong> ${escapeHtml(request.title)}<br>
       <strong>Status:</strong> ${getStatusDisplay(request.status)}<br>
       <strong>Deliver to:</strong> ${escapeHtml(request.delivery_location ?? "—")}</p>
    <p>We’ve attached a PDF receipt. Scan the QR code in the receipt to open this request in your dashboard.</p>
    <p><a href="${escapeHtml(deepLink)}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Open my request</a></p>
    <p style="font-size:12px;color:#666;">For questions, contact the Supply Room.</p>
  </body>
</html>`;
}

function fulfilledHtml(request: SupplyRequest, requester: Requester, deepLink: string, completedBy: string | null): string {
  return `<!doctype html>
<html>
  <body style="font-family:Arial,sans-serif;max-width:600px;margin:24px auto;color:#111;">
    <h2 style="color:#2563eb;">NYSC Facilities Hub</h2>
    <h1>Your supply request is ready</h1>
    <p>Hi ${formatName(requester)},</p>
    <p>Request <strong>${formatRequestId(request)}</strong> is ready for pickup.</p>
    <p><strong>Title:</strong> ${escapeHtml(request.title)}<br>
       <strong>Deliver to:</strong> ${escapeHtml(request.delivery_location ?? "—")}</p>
    ${completedBy ? `<p><strong>Completed by:</strong> ${escapeHtml(completedBy)}</p>` : ""}
    <p>We’ve attached a PDF pickup receipt. Scan the QR code in the receipt to open this request in your dashboard.</p>
    <p><a href="${escapeHtml(deepLink)}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Open my request</a></p>
  </body>
</html>`;
}

function teamAlertHtml(request: SupplyRequest, requester: Requester, deepLink: string): string {
  return `<!doctype html>
<html>
  <body style="font-family:Arial,sans-serif;max-width:600px;margin:24px auto;color:#111;">
    <h2 style="color:#2563eb;">NYSC Facilities Hub</h2>
    <h1>New supply request</h1>
    <p><strong>${formatName(requester)}</strong> submitted a new supply request.</p>
    <p><strong>Request:</strong> ${formatRequestId(request)} — ${escapeHtml(request.title)}<br>
       <strong>Priority:</strong> ${request.priority.toUpperCase()}<br>
       <strong>Deliver to:</strong> ${escapeHtml(request.delivery_location ?? "—")}</p>
    <p><a href="${escapeHtml(deepLink)}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">View in admin</a></p>
  </body>
</html>`;
}

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // GET /send-supply-email?open=<id>&sig=<sig> → verify and redirect to app
  if (req.method === "GET") {
    const url = new URL(req.url);
    const open = url.searchParams.get("open");
    const sig = url.searchParams.get("sig");
    if (open && sig) {
      const valid = await verifyDeepLink(open, sig);
      if (!valid) {
        return new Response("Invalid or expired link", { status: 403, headers: corsHeaders });
      }
      return Response.redirect(`${APP_URL}/my-supply-requests?open=${encodeURIComponent(open)}`, 302);
    }
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  if (!originAllowed(req)) {
    return new Response(
      JSON.stringify({ error: "Origin not allowed" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Auth: require valid Supabase JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Server configuration error: Supabase auth credentials are missing");
    }

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json()) as EmailPayload;
    if (!body?.type || !["receipt", "fulfilled", "new_request_team", "team_test"].includes(body.type)) {
      return new Response(
        JSON.stringify({ error: "Invalid payload: valid type required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = String(claimsData.claims.sub ?? "");
    const serviceClient = getServiceClient();

    if (body.type === "team_test") {
      if (!userId || !(await userCanSendTeamTest(serviceClient, userId))) {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await sendTeamTestEmail();
      return new Response(
        JSON.stringify({ success: true, result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.requestId || !isUuid(body.requestId)) {
      return new Response(
        JSON.stringify({ error: "Invalid payload: valid requestId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { request, requester, items, history, completedBy } = await fetchRequestData(serviceClient, body.requestId);

    // Authorization: caller must own the request or hold a supply-staff role
    const isOwner = !!userId && request.requester_id === userId;
    const isStaff = !!userId && (await userCanSendTeamTest(serviceClient, userId));
    if (!isOwner && !isStaff) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!requester.email) {
      return new Response(
        JSON.stringify({ error: "Requester has no email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: any;
    if (body.type === "new_request_team") {
      result = await sendTeamAlert(request, requester);
    } else {
      result = await sendReceiptEmail(body.type, request, requester, items, history, completedBy);
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-supply-email error:", {
      message: getErrorMessage(error),
      error,
    });
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
