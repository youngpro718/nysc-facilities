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
    calendar_type?: string;
    out_dates?: string[];
    cases: Array<{
      defendant: string;
      indictment_number?: string;
      jury_indicator?: boolean;
      top_charge?: string;
      status?: {
        js_date?: string;
        hrg_date?: string;
        conf_date?: string;
        calendar_info?: string;
        adjournment?: string;
      };
      attorneys?: string[];
      ada_assigned?: string[];
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
            content: `You are extracting data from Court Daily Reports. Extract ALL information accurately.

The document structure:
- Header: Date (MM-DD-YY format, e.g., "10-22-25"), Report Type (AM/PM/AM PM), Location (e.g., "100 CENTRE STREET" or "111 CENTRE STREET")
- Table with entries organized by Part number (e.g., "PART 22", "PART 37")
- Each Part has: Part#, Judge name, Calendar type, and multiple case rows
- Special notations: OUT (judge unavailable), Cal [Day] (calendar day), JS (jury selection), (J) (jury case marker)
- Status codes: CONF, HRG, CALENDAR, ADJ, etc.
- Footer notes with administrative information

For dates, convert from MM-DD-YY format to YYYY-MM-DD format (e.g., "10-22-25" becomes "2025-10-22").

Extract:
1. Report metadata (date in YYYY-MM-DD, type, location)
2. All parts with their judges and cases
3. For each case: defendant name, indictment/case #, charge, status dates, attorneys
4. Special notes and footer information`
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
                      part: { type: 'string', description: 'Part number (e.g., "22", "37")' },
                      judge: { type: 'string', description: 'Judge name' },
                      calendar_type: { type: 'string', description: 'Calendar type if specified' },
                      out_dates: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'Dates when judge is out/unavailable'
                      },
                      cases: {
                        type: 'array',
                        description: 'Array of cases for this part',
                        items: {
                          type: 'object',
                          properties: {
                            defendant: { type: 'string', description: 'Defendant name' },
                            indictment_number: { type: 'string', description: 'Case/indictment number' },
                            jury_indicator: { type: 'boolean', description: 'True if (J) marker present indicating jury case' },
                            top_charge: { type: 'string', description: 'Top charge code' },
                            status: {
                              type: 'object',
                              properties: {
                                js_date: { type: 'string', description: 'Jury selection date' },
                                hrg_date: { type: 'string', description: 'Hearing date' },
                                conf_date: { type: 'string', description: 'Conference date' },
                                calendar_info: { type: 'string', description: 'Calendar information' },
                                adjournment: { type: 'string', description: 'Adjournment information' }
                              }
                            },
                            attorneys: { 
                              type: 'array', 
                              items: { type: 'string' },
                              description: 'Defense attorney names'
                            },
                            ada_assigned: { 
                              type: 'array', 
                              items: { type: 'string' },
                              description: 'ADA names assigned'
                            }
                          },
                          required: ['defendant']
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
          calendar_type: entry.calendar_type,
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
              indictment_number: courtCase.indictment_number,
              jury_indicator: courtCase.jury_indicator || false,
              top_charge: courtCase.top_charge,
              js_date: courtCase.status?.js_date,
              hrg_date: courtCase.status?.hrg_date,
              conf_date: courtCase.status?.conf_date,
              calendar_info: courtCase.status?.calendar_info,
              adjournment: courtCase.status?.adjournment,
              attorneys: courtCase.attorneys,
              ada_assigned: courtCase.ada_assigned
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
