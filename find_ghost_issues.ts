
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fmymhtuiqzhupjyopfvi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZteW1odHVpcXpodXBqeW9wZnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDc4OTYsImV4cCI6MjA1MzgyMzg5Nn0.1OvOXiLEj3QKGjAEZCSWqw8zzewsYgfTlVDcDEdfCjE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function findGhostIssues() {
    console.log('--- Auditing Active Issues ---');

    // Statuses that the dashboard considers "active"
    const activeStatuses = ['open', 'in_progress'];

    const { data: issues, error } = await supabase
        .from('issues')
        .select(`
      id,
      title,
      status,
      priority,
      created_at,
      room_id,
      description,
      rooms:room_id(
        room_number,
        floors(
          name,
          buildings(address)
        )
      )
    `)
        .in('status', activeStatuses);

    if (error) {
        console.error('Error fetching issues:', error);
        return;
    }

    if (!issues || issues.length === 0) {
        console.log('No active issues found in the database.');
        return;
    }

    console.log(`Found ${issues.length} active issues:`);
    issues.forEach(issue => {
        const room = issue.rooms as any;
        const building = room?.floors?.buildings?.address || 'Unknown Building';
        const roomNum = room?.room_number || 'Unknown Room';
        console.log(`- [${issue.status.toUpperCase()}] ${issue.title} (${issue.priority})`);
        console.log(`  Room: ${roomNum}, Building: ${building}`);
        console.log(`  ID: ${issue.id}`);
        console.log(`  Created: ${issue.created_at}`);
        console.log('----------------------------');
    });

    // Also check for room shutdowns that might be affecting the count elsewhere
    const { data: shutdowns, error: shutError } = await supabase
        .from('room_shutdowns')
        .select(`
      id,
      status,
      reason,
      start_date,
      end_date,
      room_id,
      court_rooms:court_room_id(
        room_number
      )
    `)
        .in('status', ['in_progress', 'scheduled']);

    if (shutError) {
        console.error('Error fetching shutdowns:', shutError);
    } else if (shutdowns && shutdowns.length > 0) {
        console.log(`\nFound ${shutdowns.length} active room shutdowns:`);
        shutdowns.forEach(s => {
            const room = s.court_rooms as any;
            console.log(`- [${s.status.toUpperCase()}] ${s.reason} (${s.start_date} to ${s.end_date})`);
            console.log(`  Room ID: ${s.room_id}, Room Number: ${room?.room_number || 'N/A'}`);
        });
    } else {
        console.log('\nNo active room shutdowns found.');
    }
}

findGhostIssues().catch(console.error);
