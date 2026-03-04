import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking Court Rooms...");
    const res1 = await supabase.from("court_rooms").select("id, room_id, room_number, is_active");
    console.log(`Total courtrooms: ${res1.data?.length}. Error: ${JSON.stringify(res1.error)}`);

    console.log("\nChecking Court Assignments...");
    const res2 = await supabase.from("court_assignments").select("room_id, part");
    console.log(`Total assignments: ${res2.data?.length}. Error: ${JSON.stringify(res2.error)}`);

    console.log("\nChecking Issues...");
    const res3 = await supabase.from("issues").select("id, title, status, room_id").in("status", ["open", "in_progress"]).not("room_id", "is", null);
    console.log(`Total open issues with room_id: ${res3.data?.length}. Error: ${JSON.stringify(res3.error)}`);
    if (res3.data && res3.data.length > 0) {
        console.log(JSON.stringify(res3.data, null, 2));
    }

    // Calculate unassigned rooms based on current logic
    const assignedRoomIds = new Set((res2.data || []).filter(a => a.part).map(a => a.room_id));

    let unassignedCount = 0;
    const unassignedRooms = [];

    res1.data?.forEach(room => {
        if (room.is_active && !assignedRoomIds.has(room.room_id)) {
            unassignedCount++;
            unassignedRooms.push(room.room_number);
        }
    });

    console.log(`\nUnassigned valid rooms count: ${unassignedCount}`);
    if (unassignedCount > 0) {
        console.log(`Unassigned rooms: ${unassignedRooms.join(', ')}`);
    }
}

check().catch(console.error);
