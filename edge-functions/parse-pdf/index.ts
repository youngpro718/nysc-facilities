import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExtractedCase {
  sending_part: string;
  defendant: string;
  purpose: string;
  transfer_date: string;
  top_charge: string;
  status: string;
  calendar_date: string;
  case_count: number;
  attorney: string;
  estimated_final_date: string;
  is_juvenile: boolean;
}

interface ExtractedEntry {
  part: string;
  judge: string;
  calendar_day: string;
  out_dates: string[];
  confidence: number;
  cases: ExtractedCase[];
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // === Authentication ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    // Verify the user's JWT
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // === Input validation ===
    const { filePath } = await req.json();

    if (!filePath || typeof filePath !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "filePath is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "AI extraction service is not configured. OPENAI_API_KEY is missing.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use service role client for storage/DB operations
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Download the PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("term-pdfs")
      .download(filePath);

    if (downloadError || !fileData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to download file: ${downloadError?.message || "File not found"}`,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Extract text from PDF
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Pdf = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    // Step 3: Send to OpenAI for structured extraction
    const systemPrompt = `You are an expert at parsing New York Supreme Court daily AM/PM reports (also called "daily reports" or "court calendars"). These are PDF documents that list court parts, justices, defendants, charges, and case statuses for a specific building and date.

REPORT FORMAT:
The report is a table with these columns:
1. First column: Part number, Justice last name, Calendar day (e.g. "Cal Wed"), OUT dates, and status notes (CONF, CHAMBERS, etc.)
2. Sending Part: Where the case came from (e.g. "PT 75", "TAP A", "OWN")
3. Defendant(s): Defendant name, sometimes with "(J)" for jury or "(J)*" for juvenile
4. P.U.R.P. (Purpose): JS = Jury Selection, HRG = Hearing, SENT = Sentencing, MOT = Motion, PLEA = Plea, CONF = Conference
5. Date Trans or Start: Date case was transferred or trial started (MM/DD format)
6. Top Charge: The most serious charge (e.g. "ATT MURD 2", "CPCS 1", "BURG 3", "MURD 1")
7. Status: Calendar counts, adjournment dates, notes. Format like "ADJ 11/24 S&C", "CALENDAR (0)", "CALENDAR 11/24 (2)", "JS COMP; OPEN; PC"
8. Attorneys: ADA names and defense attorney names
9. Last column: Next court date (MM/DD format, sometimes with "H" suffix for half-day)

SPECIAL NOTES TO PARSE:
- "SITTING IN PT XX, MM/DD-DURATION OF TRIAL" means the justice is temporarily in another part
- "AVAILABLE" means the part has no cases scheduled
- "CONF" in the first column means conference
- "CHAMBERS" means the justice is in chambers
- Calendar counts like "CALENDAR (0)" mean zero cases on calendar, "CALENDAR 11/24 (2)" means 2 cases on the 11/24 calendar
- "(J)" after defendant name means jury trial
- "(J)*" means juvenile

EXTRACTION RULES:
- Extract EVERY row/part from the report, even if it has no cases (mark as AVAILABLE)
- For parts with multiple cases, create separate case entries
- Parse out_dates from the first column (e.g. "OUT 11/26-11/28; 12/24" → ["11/26-11/28", "12/24"])
- The calendar_day is like "Cal Wed", "Cal Tues", "Cal Mon", etc.
- Confidence should be 0.95 for clearly parsed rows, 0.85 for partially parsed, 0.7 for uncertain

Return ONLY valid JSON matching this exact schema:
{
  "report_date": "YYYY-MM-DD",
  "building": "111 Centre Street" or "100 Centre Street",
  "report_type": "AM PM REPORT",
  "entries": [
    {
      "part": "22",
      "judge": "STATSINGER",
      "calendar_day": "Cal Wed",
      "out_dates": ["11/26-11/28", "12/24"],
      "confidence": 0.95,
      "cases": [
        {
          "sending_part": "",
          "defendant": "",
          "purpose": "",
          "transfer_date": "",
          "top_charge": "",
          "status": "CALENDAR (0); CALENDAR 11/24 (2); AVAILABLE",
          "calendar_date": "",
          "case_count": 0,
          "attorney": "",
          "estimated_final_date": "",
          "is_juvenile": false
        }
      ]
    }
  ]
}`;

    const userPrompt = `Parse the following court daily report PDF. Extract ALL parts and their cases into the structured JSON format described. Be thorough - capture every row even if a part has no active cases (mark those as AVAILABLE with empty case fields).

The PDF content is provided as a base64-encoded document.`;

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:application/pdf;base64,${base64Pdf}`,
                    detail: "high",
                  },
                },
              ],
            },
          ],
          max_tokens: 16000,
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: "AI extraction failed. Please try again.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiResult = await openaiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "AI returned empty response.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse the AI response
    let extractedData: {
      report_date?: string;
      building?: string;
      report_type?: string;
      entries: ExtractedEntry[];
    };

    try {
      extractedData = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response as JSON:", content);
      return new Response(
        JSON.stringify({
          success: false,
          error: "AI response was not valid JSON. Please try again.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate we got entries
    if (
      !extractedData.entries ||
      !Array.isArray(extractedData.entries) ||
      extractedData.entries.length === 0
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No court sessions could be extracted from the document.",
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Normalize and clean extracted entries
    const cleanedEntries: ExtractedEntry[] = extractedData.entries.map(
      (entry) => ({
        part: String(entry.part || "").trim(),
        judge: String(entry.judge || "").trim(),
        calendar_day: String(entry.calendar_day || "").trim(),
        out_dates: Array.isArray(entry.out_dates)
          ? entry.out_dates.map((d: string) => String(d).trim())
          : [],
        confidence: typeof entry.confidence === "number" ? entry.confidence : 0.85,
        cases: Array.isArray(entry.cases)
          ? entry.cases.map((c) => ({
              sending_part: String(c.sending_part || "").trim(),
              defendant: String(c.defendant || "").trim(),
              purpose: String(c.purpose || "").trim(),
              transfer_date: String(c.transfer_date || "").trim(),
              top_charge: String(c.top_charge || "").trim(),
              status: String(c.status || "").trim(),
              calendar_date: String(c.calendar_date || "").trim(),
              case_count:
                typeof c.case_count === "number" ? c.case_count : 0,
              attorney: String(c.attorney || "").trim(),
              estimated_final_date: String(
                c.estimated_final_date || ""
              ).trim(),
              is_juvenile: Boolean(c.is_juvenile),
            }))
          : [],
      })
    );

    // Log extraction summary
    console.log(
      `✅ Extracted ${cleanedEntries.length} parts from ${extractedData.building || "unknown building"} report dated ${extractedData.report_date || "unknown"} by user ${userId}`
    );

    // Store extraction metadata for audit trail
    try {
      await supabase.from("pdf_extraction_logs").insert({
        file_path: filePath,
        report_date: extractedData.report_date || null,
        building: extractedData.building || null,
        parts_extracted: cleanedEntries.length,
        total_cases: cleanedEntries.reduce(
          (sum, e) => sum + e.cases.length,
          0
        ),
        raw_response_length: content.length,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Non-critical — don't fail the request if logging fails
      console.warn("Failed to log extraction metadata (table may not exist)");
    }

    return new Response(
      JSON.stringify({
        success: true,
        extracted_data: {
          report_date: extractedData.report_date,
          building: extractedData.building,
          report_type: extractedData.report_type,
          entries: cleanedEntries,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in parse-pdf:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred while processing the document.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
