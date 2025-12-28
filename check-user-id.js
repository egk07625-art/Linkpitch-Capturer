require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  console.log('=== Checking Users ===');
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, clerk_id, name')
    .order('created_at', { ascending: false });
  
  if (userError) {
    console.error('User Error:', userError);
  } else {
    console.table(users);
  }
  
  console.log('\n=== Checking Recent Prospects ===');
  const { data: prospects, error: prospectError } = await supabase
    .from('prospects')
    .select('id, user_id, name, store_name, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (prospectError) {
    console.error('Prospect Error:', prospectError);
  } else {
    console.table(prospects);
  }
}

checkData().then(() => process.exit(0));
