
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";
import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/+esm";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": 
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { term_id, pdf_url } = await req.json();

    if (!term_id || !pdf_url) {
      return new Response(
        JSON.stringify({ error: "Missing term_id or pdf_url parameter" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Processing term sheet PDF for term_id: ${term_id}`);
    console.log(`PDF URL: ${pdf_url}`);

    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch PDF data from the URL
    const pdfResponse = await fetch(pdf_url);
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    
    // Load the PDF
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
    const loadingTask = pdfjsLib.getDocument({ data: pdfArrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Extract text from all pages
    const extractedText: string[] = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      extractedText.push(pageText);
    }
    
    const fullText = extractedText.join(' ');
    
    // Extract term information
    const termInfo = extractTermInfo(fullText);
    
    // Extract justice assignments
    const assignments = extractAssignments(fullText);
    
    // Extract personnel
    const personnel = extractPersonnel(fullText);
    
    // Update term information if needed
    if (Object.keys(termInfo).length > 0) {
      const { data: termData, error: termError } = await supabase
        .from('court_terms')
        .update(termInfo)
        .eq('id', term_id);
        
      if (termError) {
        console.error("Error updating term info:", termError);
      }
    }
    
    // Create court parts if they don't exist
    for (const assignment of assignments) {
      const { data: partData, error: partError } = await supabase
        .from('court_parts')
        .select('id')
        .eq('part_code', assignment.partCode)
        .single();
        
      if (partError && partError.code !== 'PGRST116') {
        console.error("Error checking court part:", partError);
        continue;
      }
      
      let partId = partData?.id;
      
      if (!partId) {
        const { data: newPart, error: createPartError } = await supabase
          .from('court_parts')
          .insert({
            part_code: assignment.partCode,
            description: `Part ${assignment.partCode}`
          })
          .select('id')
          .single();
          
        if (createPartError) {
          console.error("Error creating court part:", createPartError);
          continue;
        }
        
        partId = newPart.id;
      }
      
      // Find corresponding room
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_number', assignment.roomNumber)
        .single();
        
      if (roomError && roomError.code !== 'PGRST116') {
        console.error("Error finding room:", roomError);
        continue;
      }
      
      // Create assignment
      const { error: assignmentError } = await supabase
        .from('term_assignments')
        .insert({
          term_id,
          part_id: partId,
          room_id: roomData?.id,
          justice_name: assignment.justiceName,
          clerk_names: assignment.clerkNames,
          sergeant_name: assignment.sergeantName,
          phone: assignment.phone,
          fax: assignment.fax,
          tel_extension: assignment.extension
        });
        
      if (assignmentError) {
        console.error("Error creating assignment:", assignmentError);
      }
    }
    
    // Create personnel records
    for (const person of personnel) {
      const { error: personnelError } = await supabase
        .from('term_personnel')
        .insert({
          term_id,
          name: person.name,
          role: person.role,
          phone: person.phone,
          extension: person.extension,
          room: person.room,
          floor: person.floor
        });
        
      if (personnelError) {
        console.error("Error creating personnel:", personnelError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        term_id,
        extracted: {
          termInfo,
          assignments: assignments.length,
          personnel: personnel.length
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error processing PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

// Helper functions for extraction
function extractTermInfo(text: string): Record<string, any> {
  const info: Record<string, any> = {};
  
  // Extract term name and period
  const termNameMatch = text.match(/([A-Z]+\s+TERM\s+\d{4})/i);
  if (termNameMatch) {
    info.term_name = termNameMatch[1].trim();
  }
  
  // Extract location
  const locationMatch = text.match(/COUNTY\s+OF\s+([A-Z]+)/i);
  if (locationMatch) {
    info.location = locationMatch[1].trim();
  }
  
  // Extract dates
  const dateRangeMatch = text.match(/(\w+\s+\d{1,2},\s*\d{4})\s+(?:to|-)\s+(\w+\s+\d{1,2},\s*\d{4})/i);
  if (dateRangeMatch) {
    const startDateStr = dateRangeMatch[1].trim();
    const endDateStr = dateRangeMatch[2].trim();
    
    try {
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        info.start_date = startDate.toISOString().split('T')[0];
        info.end_date = endDate.toISOString().split('T')[0];
      }
    } catch (e) {
      console.error("Error parsing dates:", e);
    }
  }
  
  return info;
}

interface Assignment {
  partCode: string;
  roomNumber: string;
  justiceName: string;
  clerkNames: string[];
  sergeantName?: string;
  phone?: string;
  fax?: string;
  extension?: string;
}

function extractAssignments(text: string): Assignment[] {
  const assignments: Assignment[] = [];
  
  // Regular expression to find court parts and justices
  const partSections = text.match(/PART\s+(\d+)[^\n]*\n+[^\n]*HON\.\s+([A-Z\s.]+)(?:\n|.)+?(?=PART|\[END\])/gi);
  
  if (!partSections) return assignments;
  
  for (const section of partSections) {
    try {
      const partMatch = section.match(/PART\s+(\d+)/i);
      const justiceMatch = section.match(/HON\.\s+([A-Z\s.]+)/i);
      const roomMatch = section.match(/ROOM\s+(\d+[A-Za-z]*)/i);
      const clerkMatch = section.match(/(?:CLERK|CLERKS)[:\s]+([A-Za-z\s,\.]+)(?:\n|$)/i);
      const sergeantMatch = section.match(/SERGEANT[:\s]+([A-Za-z\s\.]+)(?:\n|$)/i);
      const phoneMatch = section.match(/(?:PHONE|TEL)[:\s]+(\(\d{3}\)\s*\d{3}-\d{4})/i);
      const faxMatch = section.match(/FAX[:\s]+(\(\d{3}\)\s*\d{3}-\d{4})/i);
      const extensionMatch = section.match(/EXT\.[:\s]+(\d+)/i);
      
      if (partMatch && justiceMatch) {
        const assignment: Assignment = {
          partCode: partMatch[1].trim(),
          justiceName: justiceMatch[1].trim(),
          roomNumber: roomMatch ? roomMatch[1].trim() : "",
          clerkNames: []
        };
        
        if (clerkMatch) {
          const clerksText = clerkMatch[1].trim();
          assignment.clerkNames = clerksText.split(/,\s*/).map(name => name.trim());
        }
        
        if (sergeantMatch) assignment.sergeantName = sergeantMatch[1].trim();
        if (phoneMatch) assignment.phone = phoneMatch[1].trim();
        if (faxMatch) assignment.fax = faxMatch[1].trim();
        if (extensionMatch) assignment.extension = extensionMatch[1].trim();
        
        assignments.push(assignment);
      }
    } catch (e) {
      console.error("Error parsing assignment section:", e);
    }
  }
  
  return assignments;
}

interface Personnel {
  name: string;
  role: string;
  phone?: string;
  extension?: string;
  room?: string;
  floor?: string;
}

function extractPersonnel(text: string): Personnel[] {
  const personnel: Personnel[] = [];
  
  // Look for personnel sections
  const personnelSections = text.match(/(?:ADMINISTRATIVE STAFF|PERSONNEL|COURT STAFF)[^\n]*(?:\n+[^\n]+){1,20}/gi);
  
  if (!personnelSections) return personnel;
  
  for (const section of personnelSections) {
    const lines = section.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip headers and separator lines
      if (/^-+$/.test(line) || /^(NAME|ROLE|PHONE|ROOM)$/i.test(line)) {
        continue;
      }
      
      const parts = line.split(/\s{2,}/).map(part => part.trim()).filter(part => part.length > 0);
      
      if (parts.length >= 2) {
        try {
          const person: Personnel = {
            name: parts[0],
            role: parts[1]
          };
          
          // Extract phone/extension if available
          const phoneMatch = line.match(/(\(\d{3}\)\s*\d{3}-\d{4})(?:\s+ext\.\s*(\d+))?/i);
          if (phoneMatch) {
            person.phone = phoneMatch[1];
            if (phoneMatch[2]) person.extension = phoneMatch[2];
          }
          
          // Extract room/floor if available
          const roomMatch = line.match(/(?:ROOM|RM\.)\s+(\d+[A-Za-z]*)/i);
          if (roomMatch) {
            person.room = roomMatch[1];
          }
          
          const floorMatch = line.match(/(?:FLOOR|FL\.)\s+(\d+)/i);
          if (floorMatch) {
            person.floor = floorMatch[1];
          }
          
          personnel.push(person);
        } catch (e) {
          console.error("Error parsing personnel line:", e);
        }
      }
    }
  }
  
  return personnel;
}
