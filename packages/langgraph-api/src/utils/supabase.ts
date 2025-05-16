// /lib/deleteUser.ts
import assert from "node:assert";
import { createClient } from "@supabase/supabase-js";

assert(process.env.SUPABASE_URL, "SUPABASE_URL is not defined");
assert(
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  "SUPABASE_SERVICE_ROLE_KEY is not defined",
);

export const supabaseAdminClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // NOT the anon/public key
);
