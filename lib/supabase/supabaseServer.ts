/**
 * Server-side Supabase client using the service role key.
 * Only import this in server components, API routes, and auth.ts.
 * Never expose this client to the browser.
 */
import { createClient } from "@supabase/supabase-js";

export function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  // Prefer service role key for full access; fall back to anon key in dev
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  if (
    !url ||
    url === "your_supabase_url_here" ||
    !key ||
    key === "your_supabase_anon_key_here"
  ) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
