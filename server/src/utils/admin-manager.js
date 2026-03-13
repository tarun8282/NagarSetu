/**
 * Admin Account Management Utility
 * Use this to create, update, or delete admin and officer accounts
 * 
 * Usage:
 *   node src/utils/admin-manager.js create <email> <password> <name> <role> [department_id] [city_id] [state_id]
 *   node src/utils/admin-manager.js list
 *   node src/utils/admin-manager.js delete <user_id>
 *   node src/utils/admin-manager.js reset-password <user_id> <new_password>
 */

const { supabase } = require('../lib/supabase');
require('dotenv').config();

const VALID_ROLES = ['dept_officer', 'mc_admin', 'state_admin'];

/**
 * Create a new admin or officer account
 */
async function createAdminAccount(email, password, fullName, role, departmentId = null, cityId = null, stateId = null) {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  if (!email || !fullName) {
    throw new Error('Email and full name are required');
  }

  console.log(`Creating ${role} account...`);
  console.log(`Email: ${email}`);
  console.log(`Name: ${fullName}`);

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    console.log('✓ Auth user created');

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: fullName,
        phone: null,
        role,
        department_id: role === 'dept_officer' ? departmentId : null,
        city_id: cityId || null,
        state_id: stateId || null,
      })
      .select()
      .single();

    if (profileError) {
      // Clean up - delete the created auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    console.log('✓ Profile created');
    console.log('\n✅ Account created successfully!');
    console.log(`User ID: ${authData.user.id}`);
    console.log(`Email: ${email}`);
    console.log(`Role: ${role}\n`);

    return { user: authData.user, profile };
  } catch (error) {
    console.error('❌ Error creating account:', error.message);
    throw error;
  }
}

/**
 * List all admin and officer accounts
 */
async function listAdminAccounts() {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, department_id, city_id, state_id, created_at')
      .in('role', VALID_ROLES)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }

    if (profiles.length === 0) {
      console.log('No admin or officer accounts found.\n');
      return;
    }

    console.log(`\n📋 Admin & Officer Accounts (${profiles.length} total)\n`);
    console.log('─'.repeat(100));

    profiles.forEach((profile) => {
      console.log(`ID: ${profile.id}`);
      console.log(`Name: ${profile.full_name}`);
      console.log(`Email: (in auth.users table)`);
      console.log(`Role: ${profile.role}`);
      if (profile.phone) console.log(`Phone: ${profile.phone}`);
      if (profile.department_id) console.log(`Department ID: ${profile.department_id}`);
      if (profile.city_id) console.log(`City ID: ${profile.city_id}`);
      if (profile.state_id) console.log(`State ID: ${profile.state_id}`);
      console.log(`Created: ${new Date(profile.created_at).toLocaleString()}`);
      console.log('─'.repeat(100));
    });
  } catch (error) {
    console.error('❌ Error fetching accounts:', error.message);
    throw error;
  }
}

/**
 * Delete an admin or officer account
 */
async function deleteAdminAccount(userId) {
  try {
    console.log(`Deleting account: ${userId}`);

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(`Failed to delete account: ${error.message}`);
    }

    console.log('✅ Account deleted successfully!\n');
  } catch (error) {
    console.error('❌ Error deleting account:', error.message);
    throw error;
  }
}

/**
 * Reset password for an account
 */
async function resetPassword(userId, newPassword) {
  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  try {
    console.log(`Resetting password for: ${userId}`);

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      throw new Error(`Failed to reset password: ${error.message}`);
    }

    console.log('✅ Password reset successfully!\n');
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    throw error;
  }
}

/**
 * CLI Handler
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'create':
        if (args.length < 4) {
          console.log('Usage: node admin-manager.js create <email> <password> <name> <role> [department_id] [city_id] [state_id]');
          console.log(`Valid roles: ${VALID_ROLES.join(', ')}`);
          process.exit(1);
        }
        await createAdminAccount(
          args[1],
          args[2],
          args[3],
          args[4],
          args[5] || null,
          args[6] || null,
          args[7] || null
        );
        break;

      case 'list':
        await listAdminAccounts();
        break;

      case 'delete':
        if (args.length < 2) {
          console.log('Usage: node admin-manager.js delete <user_id>');
          process.exit(1);
        }
        await deleteAdminAccount(args[1]);
        break;

      case 'reset-password':
        if (args.length < 3) {
          console.log('Usage: node admin-manager.js reset-password <user_id> <new_password>');
          process.exit(1);
        }
        await resetPassword(args[1], args[2]);
        break;

      default:
        console.log('Admin Account Manager\n');
        console.log('Commands:');
        console.log('  create <email> <password> <name> <role> [department_id] [city_id] [state_id]');
        console.log('    Create a new admin or officer account');
        console.log('    Valid roles: dept_officer, mc_admin, state_admin\n');
        console.log('  list');
        console.log('    List all admin and officer accounts\n');
        console.log('  delete <user_id>');
        console.log('    Delete an account\n');
        console.log('  reset-password <user_id> <new_password>');
        console.log('    Reset password for an account\n');
        console.log('Examples:');
        console.log('  node admin-manager.js create admin@nagarsetu.com MyPass123! "Admin User" mc_admin');
        console.log('  node admin-manager.js create officer@dept.com MyPass123! "Officer Name" dept_officer <dept-uuid>');
        console.log('  node admin-manager.js list');
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Export functions for use in other modules
module.exports = {
  createAdminAccount,
  listAdminAccounts,
  deleteAdminAccount,
  resetPassword,
};

// Run CLI if called directly
if (require.main === module) {
  main();
}
