#!/usr/bin/env node

/**
 * Quick Rate Limit Reset Script (ES Module)
 * 
 * Usage: node reset-rate-limit.mjs <email>
 * Example: node reset-rate-limit.mjs admin@nysc.gov
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration.');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetRateLimit(email) {
  console.log(`🔄 Resetting all rate limits for: ${email}`);
  
  try {
    // Delete all rate limits for the email
    const { error } = await supabase
      .from('auth_rate_limits')
      .delete()
      .eq('identifier', email);
    
    if (error) {
      console.error('❌ Error resetting rate limit:', error.message);
      return false;
    }
    
    console.log('✅ Rate limit reset successfully!');
    console.log('ℹ️  The user should now be able to attempt login again.');
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📖 Usage: node reset-rate-limit.mjs <email>');
    console.log('Example: node reset-rate-limit.mjs admin@nysc.gov');
    process.exit(0);
  }
  
  const email = args[0];
  
  if (!email.includes('@')) {
    console.error('❌ Invalid email format');
    process.exit(1);
  }
  
  const success = await resetRateLimit(email);
  process.exit(success ? 0 : 1);
}

main();
