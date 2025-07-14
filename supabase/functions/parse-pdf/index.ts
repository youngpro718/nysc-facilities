import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ParsedTermData {
  termName: string;
  location: string;
  assignments: Array<{
    part: string;
    justice: string;
    room_number: string;
    clerks?: string[];
    sergeant?: string;
    tel?: string;
    fax?: string;
    calendar_day?: string;
  }>;
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
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Download the PDF file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('term-pdfs')
      .download(filePath)

    if (downloadError) {
      throw new Error(`Failed to download PDF: ${downloadError.message}`)
    }

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Simple text extraction approach
    // Convert binary data to string and look for patterns
    const textContent = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array)
    
    console.log('📄 Extracted text length:', textContent.length)
    
    // Parse the extracted text for court assignments
    const parsedData = parseCourtAssignments(textContent)
    
    console.log('✅ Parsed assignments:', parsedData.assignments.length)

    return new Response(
      JSON.stringify(parsedData),
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
        error: error.message || 'Failed to parse PDF',
        assignments: []
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

function parseCourtAssignments(text: string): ParsedTermData {
  console.log('🔍 Parsing court assignments from text...')
  
  // Look for term information
  let termName = 'Unknown Term'
  let location = 'Unknown Location'
  
  // Extract term name (look for "TERM" followed by Roman numerals or numbers)
  const termMatch = text.match(/TERM\s+([IVX]+|\d+)/i)
  if (termMatch) {
    termName = termMatch[0]
  }
  
  // Extract location information
  const locationMatch = text.match(/(?:COUNTY|COURT|LOCATION)[\s:]+([A-Z\s]+?)(?:\n|$)/i)
  if (locationMatch) {
    location = locationMatch[1].trim()
  }

  const assignments: any[] = []
  
  // Split text into lines and look for assignment patterns
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0)
  
  console.log('📝 Processing', lines.length, 'lines of text')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Look for patterns that might indicate court assignments
    // Common patterns: "Part [A-Z]" or "Room [0-9]" or "Justice [Name]"
    if (line.match(/part\s+[a-z0-9]+/i) || line.match(/room\s+\d+/i) || line.match(/justice/i)) {
      
      // Try to extract assignment data from this line and surrounding lines
      const assignment = extractAssignmentFromLines(lines, i)
      if (assignment) {
        assignments.push(assignment)
        console.log('✅ Found assignment:', assignment.part, assignment.justice)
      }
    }
  }
  
  // If no structured assignments found, try simpler pattern matching
  if (assignments.length === 0) {
    console.log('🔄 Trying simpler pattern matching...')
    
    // Look for any text that contains room numbers and names
    const simplePattern = /(\d+)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
    let match
    
    while ((match = simplePattern.exec(text)) !== null) {
      const roomNumber = match[1]
      const possibleName = match[2]
      
      if (possibleName.length > 3 && possibleName.length < 50) {
        assignments.push({
          part: `Part-${assignments.length + 1}`,
          justice: possibleName,
          room_number: roomNumber
        })
      }
    }
  }

  return {
    termName,
    location,
    assignments
  }
}

function extractAssignmentFromLines(lines: string[], startIndex: number): any | null {
  const line = lines[startIndex]
  
  // Initialize assignment object
  const assignment: any = {
    part: '',
    justice: '',
    room_number: ''
  }
  
  // Extract part information
  const partMatch = line.match(/part\s+([a-z0-9]+)/i)
  if (partMatch) {
    assignment.part = partMatch[1].toUpperCase()
  }
  
  // Extract room number
  const roomMatch = line.match(/room\s+(\d+)/i)
  if (roomMatch) {
    assignment.room_number = roomMatch[1]
  }
  
  // Look for justice name in current line or next few lines
  for (let i = 0; i < 3 && startIndex + i < lines.length; i++) {
    const searchLine = lines[startIndex + i]
    
    // Look for patterns like "Justice [Name]" or "Hon. [Name]"
    const justiceMatch = searchLine.match(/(?:justice|hon\.?)\s+([a-z\s]+)/i)
    if (justiceMatch) {
      assignment.justice = justiceMatch[1].trim()
      break
    }
    
    // If no explicit "Justice" keyword, look for capitalized names
    const nameMatch = searchLine.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/)
    if (nameMatch && nameMatch[1].length < 50) {
      assignment.justice = nameMatch[1].trim()
      break
    }
  }
  
  // Only return assignment if we have at least a part or room number
  if (assignment.part || assignment.room_number) {
    return assignment
  }
  
  return null
}