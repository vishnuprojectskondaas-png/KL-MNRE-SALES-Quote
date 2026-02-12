
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ndldslatnaygayykship.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kbGRzbGF0bmF5Z2F5eWtzaGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4OTYwOTcsImV4cCI6MjA4NjQ3MjA5N30.0YQa1GFTtElZqiRWhRyjh4azIwRL-NOhVgiOMuVbbro';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
