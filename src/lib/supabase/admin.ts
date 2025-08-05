import { createClient } from "@supabase/supabase-js";

// Admin client with service role key for admin operations
// Lazy-loaded to prevent initialization during build time
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

export const supabaseAdmin = () => {
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Missing required environment variables for Supabase admin client"
      );
    }

    supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdminInstance;
};
