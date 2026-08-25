import { createClient } from "@supabase/supabase-js";

const env = (import.meta as unknown as { env?: Record<string, string> }).env;

const supabaseUrl =
  env?.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co";

const supabaseAnonKey =
  env?.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key";

/**
 * 统一 Supabase Client 实例
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
});
