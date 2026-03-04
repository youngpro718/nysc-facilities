import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fmymhtuiqzhupjyopfvi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZteW1odHVpcXpodXBqeW9wZnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDc4OTYsImV4cCI6MjA1MzgyMzg5Nn0.1OvOXiLEj3QKGjAEZCSWqw8zzewsYgfTlVDcDEdfCjE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase
        .from('issues')
        .select('issue_type')
        .limit(100);

    if (error) {
        console.error("Error:", error);
    } else {
        const types = Array.from(new Set(data.map(d => d.issue_type)));
        console.log("Existing issue types:", types);
    }
}

run();
