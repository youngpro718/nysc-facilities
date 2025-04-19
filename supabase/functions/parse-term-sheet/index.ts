
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
    
    // Fetch PDF data
    const pdfResponse = await fetch(pdf_url);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
    }

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

      // Process each assignment
      for (const assignment of assignments) {
        console.log(`Processing assignment for part ${assignment.partCode}`);
        
        // Find or create the court part
        const { data: partData, error: partError } = await supabase
          .from('court_parts')
          .select('id')
          .eq('part_code', assignment.partCode)
          .maybeSingle();
          
        if (partError) {
          console.error("Error checking court part:", partError);
          continue;
        }
        
        let partId = partData?.id;
        
        if (!partId) {
          console.log(`Creating new court part: ${assignment.partCode}`);
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
        
        // Find corresponding room if available
        let roomId = null;
        if (assignment.roomNumber) {
          const { data: roomData, error: roomError } = await supabase
            .from('rooms')
            .select('id')
            .eq('room_number', assignment.roomNumber)
            .maybeSingle();
            
          if (roomError && roomError.code !== 'PGRST116') {
            console.error("Error finding room:", roomError);
          } else if (roomData) {
            roomId = roomData.id;
          }
        }
        
        // Create term assignment
        console.log(`Creating assignment: Part ${assignment.partCode}, Justice: ${assignment.justiceName}`);
        const { error: assignmentError } = await supabase
          .from('term_assignments')
          .insert({
            term_id,
            part_id: partId,
            room_id: roomId,
            justice_name: assignment.justiceName,
            clerk_names: assignment.clerkNames || [],
            sergeant_name: assignment.sergeantName,
            phone: assignment.phone,
            fax: assignment.fax || null,
            tel_extension: assignment.extension
          });
          
        if (assignmentError) {
          console.error("Error creating assignment:", assignmentError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        term_id,
        extracted: {
          assignments: assignments.length,
          personnel: assignments.length // Since we're focusing on assignments for now
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
      JSON.stringify({ error: error.message || "Unknown error processing PDF" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
