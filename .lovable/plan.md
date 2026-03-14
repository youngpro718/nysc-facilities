

# Replace Coordinate-Based PDF Parser with AI Edge Function

## Problem
The current client-side parser (`dailyReportParser.ts`) uses brittle X/Y coordinate mapping from pdf.js to extract court report data. This breaks when PDF layouts shift, column widths change, multi-line fields span rows, or fonts/encodings differ.

An edge function already exists at `edge-functions/parse-pdf/index.ts` with GPT-4o logic, but it calls OpenAI directly and the project only has `LOVABLE_API_KEY` (no `OPENAI_API_KEY`). It's also never called from the client.

## Plan

### 1. Fix existing build errors (prerequisite)

**`src/components/inventory/InventoryAuditsPanel.tsx`** — Duplicate `retry` property (line 62 `retry: false` and line 126 `retry: 2`). Remove the first `retry: false` on line 62.

**`src/routes/OnboardingGuard.tsx`** — Line 98-99: `withTimeout()` wraps a Supabase query chain (`supabase.from().select().eq().maybeSingle()`) which returns a `PostgrestBuilder`, not a `Promise`. Fix by wrapping it: `withTimeout(supabase.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle().then(r => r), ...)` to convert to a real Promise.

### 2. Rewrite parse-pdf edge function to use Lovable AI Gateway

**`edge-functions/parse-pdf/index.ts`** — Major changes:
- Replace direct OpenAI API call with Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`)
- Use `LOVABLE_API_KEY` instead of `OPENAI_API_KEY`
- Use model `google/gemini-2.5-pro` (best for complex document reasoning + large context)
- Keep the existing auth/RBAC checks, input validation, and audit logging
- Keep the same system prompt and response schema
- Accept base64 PDF content directly from the client (instead of downloading from storage), so the client can send the file immediately without uploading first

### 3. Update client to call edge function instead of local parser

**`src/components/court-operations/UploadDailyReportDialog.tsx`** — Replace the `parseDailyReportPDF(file)` call with:
- Convert file to base64
- Call `supabase.functions.invoke('parse-pdf', { body: { pdfBase64, fileName } })`
- Use the response the same way (same `extracted_data` shape)
- Upload to storage for archival happens after (already does this)

### 4. Keep dailyReportParser.ts as fallback (no deletion)

The local parser stays in the codebase as a fallback but is no longer the primary path. The import can remain for potential offline/fallback use.

## Files Modified

| File | Change |
|------|--------|
| `src/components/inventory/InventoryAuditsPanel.tsx` | Remove duplicate `retry` property |
| `src/routes/OnboardingGuard.tsx` | Fix `withTimeout` wrapping of PostgrestBuilder |
| `edge-functions/parse-pdf/index.ts` | Rewrite to use Lovable AI Gateway with `LOVABLE_API_KEY` |
| `src/components/court-operations/UploadDailyReportDialog.tsx` | Call edge function instead of local parser |

