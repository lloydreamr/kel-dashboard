/**
 * Setup Test Users Script
 *
 * Creates test users for E2E testing with email/password authentication.
 * These users are required for Playwright tests with PLAYWRIGHT_TEST_MODE=true.
 *
 * Run with: npx tsx --env-file=.env.local scripts/setup-test-users.ts
 *
 * Prerequisites:
 * - .env.local must have SUPABASE_SERVICE_ROLE_KEY set
 */

import { createClient } from '@supabase/supabase-js';

import type { Database } from '../src/types/database';

// Loaded via --env-file flag
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nMake sure .env.local is configured with these values.');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Test users that match mock-login route expectations
 */
const TEST_USERS = [
  {
    email: 'maho@test.kel-dashboard.local',
    password: 'TestPassword123!',
    displayName: 'Maho (Test)',
  },
  {
    email: 'kel@test.kel-dashboard.local',
    password: 'TestPassword123!',
    displayName: 'Kel (Test)',
  },
];

async function createOrUpdateUser(user: (typeof TEST_USERS)[0]) {
  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === user.email);

  if (existing) {
    console.log(`✅ User already exists: ${user.email}`);
    // Update password to ensure it matches expected value
    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
      password: user.password,
    });
    if (updateError) {
      console.error(`   ⚠️  Could not update password: ${updateError.message}`);
    } else {
      console.log(`   🔑 Password updated to match test config`);
    }
    return existing.id;
  }

  // Create new user
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true, // Auto-confirm email for test users
    user_metadata: {
      display_name: user.displayName,
    },
  });

  if (error) {
    console.error(`❌ Failed to create user ${user.email}: ${error.message}`);
    return null;
  }

  console.log(`✅ Created user: ${user.email} (ID: ${data.user.id})`);
  return data.user.id;
}

async function main() {
  console.log('🔧 Setting up E2E test users...\n');
  console.log(`   Supabase: ${supabaseUrl}\n`);

  let allSuccess = true;

  for (const user of TEST_USERS) {
    const userId = await createOrUpdateUser(user);
    if (!userId) allSuccess = false;
  }

  console.log('');

  if (allSuccess) {
    console.log('✨ Test users ready!');
    console.log('');
    console.log('You can now run E2E tests with:');
    console.log('   PLAYWRIGHT_TEST_MODE=true npm run test:e2e');
  } else {
    console.log('⚠️  Some users could not be created. Check errors above.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
