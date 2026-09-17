import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ldbjfowzngtspztgwdci.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_4QRrwXIo6hDOCp5i1HvOog_6aEBVwBU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('colleges').select('count', { count: 'exact', head: true });
    if (error) {
      console.log(`Supabase connection status: Client active (${SUPABASE_URL}), query returned: ${error.message}`);
      return { connected: true, tablesExist: false, error: error.message };
    }
    console.log(`Supabase connected successfully to ${SUPABASE_URL}`);
    return { connected: true, tablesExist: true };
  } catch (err) {
    console.error('Supabase connection check error:', err);
    return { connected: false, error: err.message };
  }
}
