import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.rpc('query_pg_policies');
  if (error) console.log('RPC error:', error.message);
  else console.log('Policies:', data);
}
run();
