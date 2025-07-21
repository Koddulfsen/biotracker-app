import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Log environment variables for debugging
console.log('=== SUPABASE DEBUG ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('Supabase URL:', supabaseUrl || 'NOT SET - THIS IS THE PROBLEM');
console.log('Supabase Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET - THIS IS THE PROBLEM');
console.log('===================');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !supabaseUrl ? 'REACT_APP_SUPABASE_URL is missing' : 'URL is set',
    key: !supabaseAnonKey ? 'REACT_APP_SUPABASE_ANON_KEY is missing' : 'Key is set'
  });
  // Don't throw error, just warn - this prevents app from crashing
  console.warn('App will not function properly without Supabase configuration');
}

// Only create client if we have valid credentials
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;