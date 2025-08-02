/**
 * Rate Limit Reset Utility
 * 
 * This script helps reset rate limits for users who are blocked from logging in.
 * Run this script with Node.js when a user reports being locked out.
 * 
 * Usage:
 * node scripts/resetRateLimit.js <email> [attempt_type]
 * 
 * Examples:
 * node scripts/resetRateLimit.js user@example.com login
 * node scripts/resetRateLimit.js user@example.com (resets all attempt types)
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

async function checkRateLimitStatus(email, attemptType = null) {
  console.log(`🔍 Checking rate limit status for: ${email}`);
  
  let query = supabase
    .from('auth_rate_limits')
    .select('*')
    .eq('identifier', email);
    
  if (attemptType) {
    query = query.eq('attempt_type', attemptType);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('❌ Error checking rate limit status:', error.message);
    return null;
  }
  
  if (!data || data.length === 0) {
    console.log('✅ No rate limit records found. User is not rate limited.');
    return [];
  }
  
  console.log('📊 Current rate limit status:');
  data.forEach(record => {
    const isBlocked = record.blocked_until && new Date(record.blocked_until) > new Date();
    console.log(`  - ${record.attempt_type}: ${record.attempts} attempts, last: ${record.last_attempt}`);
    console.log(`    ${isBlocked ? '🔒 BLOCKED' : '✅ Active'} ${record.blocked_until ? `until ${record.blocked_until}` : ''}`);
  });
  
  return data;
}

async function resetRateLimit(email, attemptType = null) {
  console.log(`🔄 Resetting rate limit for: ${email}${attemptType ? ` (${attemptType})` : ' (all types)'}`);
  
  let query = supabase
    .from('auth_rate_limits')
    .delete()
    .eq('identifier', email);
    
  if (attemptType) {
    query = query.eq('attempt_type', attemptType);
  }
  
  const { error } = await query;
  
  if (error) {
    console.error('❌ Error resetting rate limit:', error.message);
    return false;
  }
  
  console.log('✅ Rate limit reset successfully!');
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📖 Usage: node scripts/resetRateLimit.js <email> [attempt_type]');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/resetRateLimit.js user@example.com login');
    console.log('  node scripts/resetRateLimit.js user@example.com (resets all)');
    console.log('');
    console.log('Available attempt types: login, signup, role_assignment');
    process.exit(0);
  }
  
  const email = args[0];
  const attemptType = args[1] || null;
  
  if (!email.includes('@')) {
    console.error('❌ Invalid email format');
    process.exit(1);
  }
  
  try {
    // Check current status
    const currentStatus = await checkRateLimitStatus(email, attemptType);
    
    if (currentStatus === null) {
      process.exit(1);
    }
    
    if (currentStatus.length === 0) {
      console.log('ℹ️  No rate limits to reset.');
      process.exit(0);
    }
    
    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('❓ Do you want to reset these rate limits? (y/N): ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        const success = await resetRateLimit(email, attemptType);
        if (success) {
          console.log('🎉 Rate limit reset completed!');
          console.log('ℹ️  The user should now be able to attempt login again.');
        }
      } else {
        console.log('❌ Operation cancelled.');
      }
      rl.close();
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

main();
