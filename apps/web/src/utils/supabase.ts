// /lib/deleteUser.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseAdminClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // NOT the anon/public key
);
