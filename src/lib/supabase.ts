import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://zoxsfwfvqfzdfccaohry.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpveHNmd2Z2cWZ6ZGZjY2FvaHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDg5MzksImV4cCI6MjEwMTc4NDkzOX0.vNXbfcReVhsMwlYRK8PqRJkzRQ-O8uvdea3XbEOF9LQ';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Create a mock or real Supabase client depending on whether keys are provided
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

