/**
 * Database Seed Script
 *
 * Seeds development data for testing.
 * Run with: npm run db:seed
 *
 * Prerequisites:
 * 1. Supabase project set up with migration applied
 * 2. .env.local configured with Supabase credentials
 * 3. Service role key set (for bypassing RLS)
 */

import { createClient } from '@supabase/supabase-js';

import type { Database } from '../src/types/database';

// Load environment variables (tsx handles this automatically)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('The service role key is required to bypass RLS for seeding.');
  console.error('Get it from Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

// Create admin client with service role key (bypasses RLS)
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seed() {
  console.log('🌱 Starting database seed...\n');

  // Check connection
  const { error: healthError } = await supabase.from('profiles').select('count');
  if (healthError) {
    console.error('❌ Failed to connect to Supabase:', healthError.message);
    process.exit(1);
  }
  console.log('✅ Connected to Supabase\n');

  // Note: Profiles are created automatically via trigger when users sign up
  // This script is for seeding any additional test data

  console.log('📝 Seed data notes:');
  console.log('   - Profiles are created automatically when users sign up');
  console.log('   - Use Supabase Auth UI or API to create test users');
  console.log('   - Role is assigned based on email pattern:');
  console.log('     - kel@* or *+kel@* → "kel" role');
  console.log('     - All others → "maho" role');
  console.log('');
  console.log('📋 To create test users:');
  console.log('   1. Go to Supabase Dashboard > Authentication > Users');
  console.log('   2. Click "Add user" and create with email/password');
  console.log('   3. Or use the magic link flow in the app');
  console.log('');

  // Example: Query existing profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (profilesError) {
    console.log('⚠️  Could not fetch profiles:', profilesError.message);
  } else if (profiles && profiles.length > 0) {
    console.log('👥 Existing profiles:');
    profiles.forEach((p) => {
      console.log(`   - ${p.email} (${p.role})`);
    });
  } else {
    console.log('👥 No profiles yet. Sign up to create one!');
  }

  console.log('\n✨ Seed complete!');
}

// Run seed
seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
