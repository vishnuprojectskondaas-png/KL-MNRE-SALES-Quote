
import { createClient } from '@supabase/supabase-js';

// Credentials for Project ID: lujokfmzldkdtsxvdefz
const SUPABASE_URL = 'https://lujokfmzldkdtsxvdefz.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1am9rZm16bGRrZHRzeHZkZWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MzMxMzUsImV4cCI6MjA4NjMwOTEzNX0.mSYBHJjzZqxH0_2kAgci1Ry9g5TPtGuP833I2zmY9ds';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
