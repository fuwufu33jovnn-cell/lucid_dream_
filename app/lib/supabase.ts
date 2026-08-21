import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./cloud-models.ts";
import { getSupabaseConfig } from "./env.ts";

let client: SupabaseClient<Database> | null | undefined;

export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (client !== undefined) {
    return client;
  }

  const config = getSupabaseConfig();
  client = config ? createClient<Database>(config.url, config.anonKey) : null;
  return client;
}
