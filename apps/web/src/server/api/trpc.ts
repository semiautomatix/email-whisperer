import { initTRPC } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

// 1. Define createContext function
export async function createContext(_opts: FetchCreateContextFnOptions) {
  return {};
}

// 2. Define Context type
type Context = Awaited<ReturnType<typeof createContext>>;

// 3. Create tRPC instance
const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
