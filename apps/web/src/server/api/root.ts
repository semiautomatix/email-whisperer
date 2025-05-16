import { router } from "./trpc";
import { chatRouter } from "./routers/chat";
import { accountsRouter } from "./routers/accounts";

export const appRouter = router({
  chat: chatRouter,
  accounts: accountsRouter,
});

export type AppRouter = typeof appRouter;
