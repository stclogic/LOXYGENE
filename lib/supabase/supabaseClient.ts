import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Returns true when real credentials are present
export const isSupabaseConfigured =
  supabaseUrl.length > 0 &&
  supabaseUrl !== "your_supabase_url_here" &&
  supabaseAnonKey.length > 0 &&
  supabaseAnonKey !== "your_supabase_anon_key_here";

// Lazy singleton — safe to call even when unconfigured (queries will fail gracefully)
let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      isSupabaseConfigured ? supabaseUrl : "https://placeholder.supabase.co",
      isSupabaseConfigured ? supabaseAnonKey : "placeholder_anon_key"
    );
  }
  return _client;
}

export const supabase = getSupabaseClient();
export default supabase;
