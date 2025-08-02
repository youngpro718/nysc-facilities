#!/usr/bin/env node

/**
 * Quick Rate Limit Reset Script
 * 
 * This is a simple, fast script to reset rate limits without confirmation prompts.
 * Use this when you need to quickly unblock a user.
 * 
 * Usage:
 * node scripts/quickResetRateLimit.js <email>
 * 
 * Example:
 * node scripts/quickResetRateLimit.js user@example.com
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  console.error('Required variables: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function quickResetRateLimit(email) {
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
    console.log('📖 Usage: node scripts/quickResetRateLimit.js <email>');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/quickResetRateLimit.js user@example.com');
    process.exit(0);
  }
  
  const email = args[0];
  
  if (!email.includes('@')) {
    console.error('❌ Invalid email format');
    process.exit(1);
  }
  
  const success = await quickResetRateLimit(email);
  process.exit(success ? 0 : 1);
}

main();
