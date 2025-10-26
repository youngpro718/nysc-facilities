import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CourtReportExtraction {
  report_date: string;
  report_type: 'AM' | 'PM' | 'AM PM';
  location: string;
  entries: Array<{
    part: string;
    judge: string;
    calendar_day?: string;
    out_dates?: string[];
    cases: Array<{
      sending_part: string;
      defendant: string;
      purpose: string;
      transfer_date: string;
      top_charge: string;
      status: string;
      attorney: string;
      estimated_final_date: string;
      indictment_number?: string;
    }>;
    special_notes?: string[];
  }>;
  footer_notes?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { filePath } = await req.json()
    
    if (!filePath) {
      throw new Error('File path is required')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Download the PDF file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('term-pdfs')
      .download(filePath)

    if (downloadError) {
      throw new Error(`Failed to download PDF: ${downloadError.message}`)
    }

    console.log('📄 Processing PDF with AI extraction...')

    // If no Lovable API key, return error prompting setup
    if (!lovableApiKey) {
      console.error('❌ LOVABLE_API_KEY not configured')
      throw new Error('AI extraction not configured. Please enable Lovable AI in your project settings.')
    }

    // Convert blob to base64 (Gemini can handle PDF directly)
    const arrayBuffer = await fileData.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    
    // Call Lovable AI Gateway for structured extraction
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are extracting data from Court Daily Reports in a 9-column table format.

PDF STRUCTURE:
- Header: Date (MM-DD-YY), Report Type (AM/PM/AM PM), Location
- Table organized by Part entries with the following 9 COLUMNS:

COLUMN 1 (Part Info): 
  - Part number (e.g., "22")
  - Judge name (e.g., "Statzinger")
  - Calendar day (e.g., "Cal Wed")
  - OUT dates (dates judge is unavailable, e.g., "OUT 10/24, 10/28, 11/10, 11/14")

COLUMN 2: Sending Part - Which part is sending/keeping the case
COLUMN 3: Defendant - Defendant name
COLUMN 4: Purpose - Purpose of court appearance
COLUMN 5: Transfer/Start Date - Date case was transferred or started
COLUMN 6: Top Charge - Primary charge code
COLUMN 7: Status - Case status information (JS date, HRG date, CONF date, etc.)
COLUMN 8: Attorney - Defense attorney name
COLUMN 9: Estimated Final Date - Expected case completion date

IMPORTANT: 
- Each ROW after the part header represents ONE CASE with all 9 columns of data.
- Extract ALL columns for each case row. Do not skip any columns.
- For dates, convert from MM-DD-YY format to YYYY-MM-DD format (e.g., "10-22-25" becomes "2025-10-22").
- Capture the calendar day from Column 1 (e.g., "Cal Wed", "Cal Mon").
- Parse OUT dates from Column 1 as an array of dates.`
          },
          {
            role: 'user',
            content: `Extract all court report data from this PDF document. Return structured JSON with all parts, judges, cases, defendants, charges, and status information.

Parse the entire document and extract every part entry you find. Each part should include the part number, judge name, and all associated case information.`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'extract_court_report',
            description: 'Extract structured court report data from the PDF',
            parameters: {
              type: 'object',
              properties: {
                report_date: { type: 'string', description: 'Report date in YYYY-MM-DD format (convert from MM-DD-YY)' },
                report_type: { type: 'string', enum: ['AM', 'PM', 'AM PM'], description: 'Report type (AM, PM, or AM PM)' },
                location: { type: 'string', description: 'Court location address' },
                entries: {
                  type: 'array',
                  description: 'Array of part entries from the court report',
                  items: {
                    type: 'object',
                    properties: {
                      part: { type: 'string', description: 'Part number from Column 1 (e.g., "22", "37")' },
                      judge: { type: 'string', description: 'Judge name from Column 1' },
                      calendar_day: { type: 'string', description: 'Calendar day from Column 1 (e.g., "Cal Wed", "Cal Mon")' },
                      out_dates: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'OUT dates from Column 1 when judge is unavailable'
                      },
                      cases: {
                        type: 'array',
                        description: 'Array of cases for this part - each row is one case with 9 columns',
                        items: {
                          type: 'object',
                          properties: {
                            sending_part: { type: 'string', description: 'Column 2: Part sending or keeping case' },
                            defendant: { type: 'string', description: 'Column 3: Defendant name' },
                            purpose: { type: 'string', description: 'Column 4: Purpose of appearance' },
                            transfer_date: { type: 'string', description: 'Column 5: Transfer or start date' },
                            top_charge: { type: 'string', description: 'Column 6: Top charge code' },
                            status: { type: 'string', description: 'Column 7: Status info (all status text as single string)' },
                            attorney: { type: 'string', description: 'Column 8: Defense attorney name' },
                            estimated_final_date: { type: 'string', description: 'Column 9: Estimated final date' },
                            indictment_number: { type: 'string', description: 'Case/indictment number if present' }
                          },
                          required: ['defendant', 'sending_part', 'purpose', 'transfer_date', 'top_charge', 'status', 'attorney']
                        }
                      },
                      special_notes: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'Special notes or annotations for this part'
                      }
                    },
                    required: ['part', 'judge']
                  }
                },
                footer_notes: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Footer notes from the report'
                }
              },
              required: ['report_date', 'report_type', 'location', 'entries']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'extract_court_report' } }
      })
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('❌ AI Gateway error:', aiResponse.status, errorText)
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.')
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to your workspace.')
      }
      
      throw new Error(`AI extraction failed: ${errorText}`)
    }

    const aiData = await aiResponse.json()
    console.log('✅ AI extraction completed')

    // Extract the function call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
    if (!toolCall) {
      throw new Error('No structured data returned from AI')
    }

    const extractedData: CourtReportExtraction = JSON.parse(toolCall.function.arguments)
    console.log('📊 Extracted', extractedData.entries.length, 'court part entries')
    
    // Store in database
    const { data: reportData, error: reportError } = await supabase
      .from('court_reports')
      .insert({
        report_date: extractedData.report_date,
        report_type: extractedData.report_type,
        location: extractedData.location,
        pdf_file_path: filePath,
        raw_extraction: extractedData
      })
      .select()
      .single()

    if (reportError) {
      console.error('❌ Database insert error:', reportError)
      throw new Error(`Failed to store report: ${reportError.message}`)
    }

    console.log('✅ Report stored with ID:', reportData.id)

    // Store entries and cases
    for (const entry of extractedData.entries) {
      const { data: entryData, error: entryError } = await supabase
        .from('court_report_entries')
        .insert({
          report_id: reportData.id,
          part: entry.part,
          judge: entry.judge,
          calendar_day: entry.calendar_day,
          out_dates: entry.out_dates,
          special_notes: entry.special_notes
        })
        .select()
        .single()

      if (entryError) {
        console.error('❌ Entry insert error for part', entry.part, ':', entryError)
        continue
      }

      // Store cases for this entry
      if (entry.cases && entry.cases.length > 0) {
        for (const courtCase of entry.cases) {
          const { error: caseError } = await supabase
            .from('court_report_cases')
            .insert({
              entry_id: entryData.id,
              defendant: courtCase.defendant,
              sending_part: courtCase.sending_part,
              purpose: courtCase.purpose,
              transfer_date: courtCase.transfer_date,
              top_charge: courtCase.top_charge,
              status: courtCase.status,
              attorney: courtCase.attorney,
              estimated_final_date: courtCase.estimated_final_date,
              indictment_number: courtCase.indictment_number
            })
          
          if (caseError) {
            console.error('❌ Case insert error:', caseError)
          }
        }
      }
    }

    console.log('✅ All data stored successfully')

    return new Response(
      JSON.stringify({
        success: true,
        report_id: reportData.id,
        extracted_data: extractedData,
        stats: {
          parts: extractedData.entries.length,
          total_cases: extractedData.entries.reduce((sum, e) => sum + (e.cases?.length || 0), 0)
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ PDF parsing error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to parse PDF'
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
