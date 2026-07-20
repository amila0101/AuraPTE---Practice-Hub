import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: profiles, error: err1 } = await supabase.from('profiles').select('id, full_name');
  console.log("Profiles:", profiles, err1);

  const { data: stats, error: err2 } = await supabase.from('daily_stats').select('user_id, questions_done');
  console.log("Stats:", stats, err2);
  
  const { data: questions, error: err3 } = await supabase.from('questions').select('id, title, sub_type, skill').limit(5);
  console.log("Questions:", questions, err3);
}

test();
