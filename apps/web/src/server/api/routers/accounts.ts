import { router, publicProcedure } from "@/server/api/trpc"; // Next.js TRPC
import { auth } from "@/auth";
import { TRPCError } from "@trpc/server";
import { supabaseAdminClient } from "@/utils/supabase";

export const accountsRouter = router({
  delete: publicProcedure.mutation(async () => {
    // Get user's session
    const session = await auth();

    if (!session?.user) {
      // 401
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }

    const userId = session.user.id;

    // Delete from Supabase Auth
    await supabaseAdminClient.auth.admin.deleteUser(userId);

    // Delete from public.users
    await supabaseAdminClient.from("users").delete().eq("id", userId);

    // Delete from next_auth schema
    await supabaseAdminClient
      .from("next_auth.sessions")
      .delete()
      .eq("userId", userId);

    await supabaseAdminClient
      .from("next_auth.accounts")
      .delete()
      .eq("userId", userId);

    await supabaseAdminClient.from("next_auth.users").delete().eq("id", userId);
  }),
});
