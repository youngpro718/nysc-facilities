import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

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
    const { term_id, pdf_url, client_extracted } = await req.json();

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
    console.log('Client extracted data:', client_extracted);

    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Use the client-extracted data if available
    const assignments = client_extracted?.assignments || [];
    console.log(`Processing ${assignments.length} assignments from client extraction`);

    // Update term information with extracted data
    if (assignments.length > 0) {
      // Clear existing assignments
      console.log("Removing existing assignments...");
      const { error: deleteAssignmentsError } = await supabase
        .from('term_assignments')
        .delete()
        .eq('term_id', term_id);
      
      if (deleteAssignmentsError) {
        console.error("Error deleting existing assignments:", deleteAssignmentsError);
      }

      // Track successful and failed creations
      const results = {
        success: 0,
        failed: 0,
        details: [] as any[]
      };

      // Process each assignment
      for (const assignment of assignments) {
        console.log(`Processing assignment for part ${assignment.partCode}`);
        
        try {
          // Clean data before processing
          const cleanPartCode = (assignment.partCode || "").trim().replace(/\s+/g, ' ');
          const cleanJusticeName = (assignment.justiceName || "").trim().replace(/\s+/g, ' ')
            .replace(/\*/g, ''); // Remove asterisks from justice names
          
          // Skip records with missing essential data
          if (!cleanPartCode || !cleanJusticeName) {
            console.warn("Skipping assignment with missing part code or justice name");
            results.failed++;
            results.details.push({
              partCode: cleanPartCode || "(missing)",
              error: "Missing required data"
            });
            continue;
          }
          
          // Find or create the court part
          const { data: partData, error: partError } = await supabase
            .from('court_parts')
            .select('id')
            .eq('part_code', cleanPartCode)
            .maybeSingle();
            
          if (partError) {
            console.error("Error checking court part:", partError);
            results.failed++;
            results.details.push({
              partCode: cleanPartCode,
              error: `Error checking court part: ${partError.message}`
            });
            continue;
          }
          
          let partId = partData?.id;
          
          if (!partId) {
            console.log(`Creating new court part: ${cleanPartCode}`);
            const { data: newPart, error: createPartError } = await supabase
              .from('court_parts')
              .insert({
                part_code: cleanPartCode,
                description: `Part ${cleanPartCode}`
              })
              .select('id')
              .single();
              
            if (createPartError) {
              console.error("Error creating court part:", createPartError);
              results.failed++;
              results.details.push({
                partCode: cleanPartCode,
                error: `Error creating court part: ${createPartError.message}`
              });
              continue;
            }
            
            partId = newPart.id;
          }
          
          // Find corresponding room if available
          let roomId = null;
          if (assignment.roomNumber) {
            const roomNumber = assignment.roomNumber.toString().trim();
            
            const { data: roomData, error: roomError } = await supabase
              .from('rooms')
              .select('id')
              .eq('room_number', roomNumber)
              .maybeSingle();
              
            if (roomError && roomError.code !== 'PGRST116') {
              console.error("Error finding room:", roomError);
            } else if (roomData) {
              roomId = roomData.id;
            } else {
              console.log(`Room ${roomNumber} not found, will be null in assignment`);
            }
          }
          
          // Parse and clean clerk names
          let clerkNames = [];
          if (Array.isArray(assignment.clerkNames)) {
            clerkNames = assignment.clerkNames
              .map((name: string) => name.trim())
              .filter((name: string) => name.length > 0);
          } else if (typeof assignment.clerkNames === 'string') {
            clerkNames = assignment.clerkNames
              .split(/[,\/]/)
              .map((name: string) => name.trim())
              .filter((name: string) => name.length > 0);
          }
          
          // Process phone & extension for improved formatting
          let phoneNumber = assignment.phone;
          let telExtension = assignment.extension;
          
          // If phone is in format "646-386-XXXX", extract extension
          if (phoneNumber && phoneNumber.includes('-')) {
            const parts = phoneNumber.split('-');
            if (parts.length === 3 && parts[0] === '646' && parts[1] === '386') {
              telExtension = parts[2];
              // Keep the full number as is
            }
          } 
          // If just the extension is provided
          else if (phoneNumber && !phoneNumber.includes('-')) {
            // Format consistently as full number
            phoneNumber = `646-386-${phoneNumber}`;
            telExtension = phoneNumber.trim();
          }
          
          // Create term assignment
          console.log(`Creating assignment: Part ${cleanPartCode}, Justice: ${cleanJusticeName}`);
          const { error: assignmentError } = await supabase
            .from('term_assignments')
            .insert({
              term_id,
              part_id: partId,
              room_id: roomId,
              justice_name: cleanJusticeName,
              clerk_names: clerkNames,
              sergeant_name: assignment.sergeantName ? 
                assignment.sergeantName.trim().replace(/^SGT\.?\s*/i, '') : null,
              phone: phoneNumber ? phoneNumber.toString().trim() : null,
              fax: assignment.fax ? assignment.fax.toString().trim() : null,
              tel_extension: telExtension ? telExtension.toString().trim() : null
            });
            
          if (assignmentError) {
            console.error("Error creating assignment:", assignmentError);
            results.failed++;
            results.details.push({
              partCode: cleanPartCode,
              error: `Error creating assignment: ${assignmentError.message}`
            });
          } else {
            results.success++;
            results.details.push({
              partCode: cleanPartCode,
              status: "success"
            });
          }
        } catch (processError) {
          console.error("Error processing assignment:", processError);
          results.failed++;
          results.details.push({
            partCode: assignment.partCode || "(unknown)",
            error: `Exception: ${processError.message}`
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          term_id,
          results,
          extracted: {
            assignments: results.success,
            personnel: 0,
            failed: results.failed
          }
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          term_id,
          error: "No assignment data provided",
          extracted: {
            assignments: 0,
            personnel: 0
          }
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }
  } catch (error) {
    console.error("Error processing PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error processing PDF" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
