require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// 1. Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE';

if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL_HERE' || !supabaseServiceKey || supabaseServiceKey === 'YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE') {
  console.error("❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file or script.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const DEFAULT_PASSWORD = 'password123';

const DEPARTMENTS = [
  { nameSuffix: 'Administration', slug: 'administration' },
  { nameSuffix: 'Finance', slug: 'finance' },
  { nameSuffix: 'Public Works (PWD)', slug: 'pwd' },
  { nameSuffix: 'Water Supply', slug: 'water' },
  { nameSuffix: 'Sewerage and Drainage', slug: 'sewerage' },
  { nameSuffix: 'Solid Waste Management', slug: 'solid_waste' },
  { nameSuffix: 'Health', slug: 'health' },
  { nameSuffix: 'Education', slug: 'education' },
  { nameSuffix: 'Fire', slug: 'fire' },
  { nameSuffix: 'Town Planning', slug: 'town_planning' },
  { nameSuffix: 'Building and Construction', slug: 'building' },
  { nameSuffix: 'Garden and Parks', slug: 'gardens' },
  { nameSuffix: 'Transport', slug: 'transport' },
  { nameSuffix: 'Environment', slug: 'environment' },
  { nameSuffix: 'IT E-Governance', slug: 'it_gov' }
];

async function seedOfficers() {
  console.log('🚀 Starting officer seeding process...');

  // 1. Fetch cities
  const { data: cities, error: fetchError } = await supabase
    .from('cities')
    .select('id, name, state_id');

  if (fetchError) {
    console.error('❌ Error fetching cities:', fetchError.message);
    return;
  }

  if (!cities || cities.length === 0) {
    console.warn('⚠️ No cities found in the database. Please add cities first.');
    return;
  }

  console.log(`✅ Found ${cities.length} cities.`);

  for (const city of cities) {
    console.log(`\n--- Processing City: ${city.name} ---`);
    const c_name = city.name.toLowerCase().replace(/\s+/g, '');

    for (const dept of DEPARTMENTS) {
      const deptName = `${city.name} ${dept.nameSuffix}`;
      
      // 2. Insert or get department
      let { data: department, error: deptError } = await supabase
        .from('departments')
        .select('id')
        .eq('city_id', city.id)
        .eq('category_slug', dept.slug)
        .maybeSingle();

      if (deptError) {
         console.error(`   ❌ Error finding department ${deptName}:`, deptError.message);
         continue;
      }

      if (!department) {
         const { data: newDept, error: insertDeptError } = await supabase
          .from('departments')
          .insert({
            city_id: city.id,
            name: deptName,
            category_slug: dept.slug
          })
          .select('id')
          .single();

         if (insertDeptError) {
           console.error(`   ❌ Error creating department ${deptName}:`, insertDeptError.message);
           continue;
         }
         department = newDept;
      }

      const officerUsername = `${c_name}_${dept.slug.replace(/_/g, '')}`;
      const officerFullName = `${city.name} ${dept.nameSuffix.split(' ')[0]} Officer`;
      const syntheticEmail = `${officerUsername}@auth.nagarsetu.com`;

      // 3. Check if officer profile already exists
      const { data: existingOfficer } = await supabase
         .from('officers')
         .select('id')
         .eq('username', officerUsername)
         .maybeSingle();

      if (existingOfficer) {
         console.log(`   ⏭️ Officer ${officerUsername} already exists. Skipping.`);
         continue;
      }

      console.log(`   ➕ Creating auth user & profile for ${officerUsername}...`);

      // 4. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: syntheticEmail,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
      });

      if (authError) {
         // If a user with that email somehow exists but no profile, we either skip or link.
         // Let's just log and skip for safety.
         console.error(`      ❌ Error creating auth user for ${officerUsername}:`, authError.message);
         continue;
      }

      const userId = authData.user.id;

      // 5. Insert Profile
      const { error: profileError } = await supabase
        .from('officers')
        .insert({
          id: userId,
          full_name: officerFullName,
          username: officerUsername,
          password: DEFAULT_PASSWORD,
          role: 'dept_officer',
          state_id: city.state_id,
          city_id: city.id,
          department_id: department.id
        });

      if (profileError) {
         console.error(`      ❌ Error creating profile for ${officerUsername}:`, profileError.message);
         // Rollback auth user
         await supabase.auth.admin.deleteUser(userId);
      } else {
         console.log(`      ✅ Successfully created ${officerUsername}`);
      }
    }
  }

  console.log('\n🎉 Seed process completed successfully!');
}

seedOfficers().catch(console.error);
