import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://ndldslatnaygayykship.supabase.co'; 
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kbGRzbGF0bmF5Z2F5eWtzaGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4OTYwOTcsImV4cCI6MjA4NjQ3MjA5N30.0YQa1GFTtElZqiRWhRyjh4azIwRL-NOhVgiOMuVbbro';

export const SUPABASE_DIRECT_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || DEFAULT_SUPABASE_URL;
export const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || DEFAULT_ANON_KEY;

const getSupabaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    // In browser/iframe environments, proxying via /api/supabase avoids cross-origin CORS/preflight blocks
    return `${window.location.origin}/api/supabase`;
  }
  return SUPABASE_DIRECT_URL;
};

export const supabase = createClient(getSupabaseUrl(), SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

export const supabaseDirect = createClient(SUPABASE_DIRECT_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});
