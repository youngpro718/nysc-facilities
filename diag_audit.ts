import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fmymhtuiqzhupjyopfvi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BpZQ2LlObzVYqbzrQAF0Cw_4RkiTPAj";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    console.log("--- CHECKING FOR ACTIVE ISSUES ---");
    const { data: issues, error: iError } = await supabase
        .from('issues')
        .select(`
            id,
            title,
            status,
            priority,
            room_id,
            rooms:room_id(
                room_number,
                floors(
                    buildings(address)
                )
            )
        `)
        .in('status', ['open', 'in_progress']);

    if (iError) {
        console.error("Issues Error:", iError.message);
    } else {
        console.log("Active Issues found:", issues?.length);
        if (issues && issues.length > 0) {
            console.log(JSON.stringify(issues, null, 2));
        }
    }

    console.log("\n--- CHECKING ROOM SHUTDOWNS ---");
    const { data: shutdowns, error: sError } = await supabase
        .from('room_shutdowns')
        .select(`
            id,
            status,
            court_room_id,
            court_rooms(
                room_number,
                rooms:room_id(
                    floors(
                        buildings(address)
                    )
                )
            )
        `)
        .in('status', ['in_progress', 'scheduled']);

    if (sError) {
        console.error("Shutdowns Error:", sError.message);
    } else {
        console.log("Active Shutdowns found:", shutdowns?.length);
        if (shutdowns && shutdowns.length > 0) {
            console.log(JSON.stringify(shutdowns, null, 2));
        }
    }
}

run();
