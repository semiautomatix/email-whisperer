import { z } from "zod";
import { router, publicProcedure } from "@/server/api/trpc"; // Next.js TRPC
import { auth } from "@/auth";
import { TRPCError } from "@trpc/server";
import { assistant } from "@email-assistant/langgraph-api";

export const chatRouter = router({
  getResponse: publicProcedure
    .input(
      z.object({
        message: z.string(),
        contextMessages: z
          .array(
            z.object({
              role: z.enum(["system", "user", "assistant"]),
              content: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { message, contextMessages } = input;

      try {
        // Get user's session
        const session = await auth();

        if (!session?.user) {
          // 401
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to access this resource",
          });
        }

        // Get the user's name - either their name or email as fallback
        const userName =
          session.user.name || session.user.email?.split("@")[0] || "User";

        // Add a system message with the user's name for email sign-offs
        const systemMessages = [
          {
            role: "system" as const,
            content: `The user's name is ${userName}. When drafting or editing emails, use this name for sign-offs when appropriate.`,
          },
        ];

        // Combine system message with existing context messages
        const enhancedContextMessages = [
          ...systemMessages,
          ...(contextMessages || []),
        ];

        const messages = await assistant({
          userId: session.user.id,
          message,
          contextMessages: enhancedContextMessages,
        });

        if (!messages?.length) {
          return {
            response:
              "I apologize, but I couldn't process your request at this time.",
          };
        }

        return {
          response: messages.slice(-1)[0]?.content,
        };
      } catch (error) {
        console.error("An error occurred processing message", { error });
        return {
          response:
            "I'm sorry, an error occurred while processing your request. Please try again later.",
        };
      }
    }),
});
