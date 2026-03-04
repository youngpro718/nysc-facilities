import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fmymhtuiqzhupjyopfvi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZteW1odHVpcXpodXBqeW9wZnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDc4OTYsImV4cCI6MjA1MzgyMzg5Nn0.1OvOXiLEj3QKGjAEZCSWqw8zzewsYgfTlVDcDEdfCjE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    console.log("Searching for Judge Park Jung Park...");
    const { data, error } = await supabase
        .from('personnel_profiles')
        .select('*')
        .or('display_name.ilike.%Park%,full_name.ilike.%Park%');

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Matching records found:", JSON.stringify(data, null, 2));

        // Find the specific one
        const target = data?.find(p =>
            (p.display_name?.toLowerCase().includes('park') && p.display_name?.toLowerCase().includes('jung')) ||
            (p.full_name?.toLowerCase().includes('park') && p.full_name?.toLowerCase().includes('jung'))
        );

        if (target) {
            console.log("Found target judge:", target.id);
            const { error: updateError } = await supabase
                .from('personnel_profiles')
                .update({
                    is_active: true,
                    judge_status: 'active',
                    departed_date: null
                })
                .eq('id', target.id);

            if (updateError) {
                console.error("Update error:", updateError);
            } else {
                console.log("SUCCESS: Judge status reset to active.");
            }
        } else {
            console.log("Judge Park Jung Park not found.");
        }
    }
}

run();
