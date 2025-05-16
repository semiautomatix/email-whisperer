// src/app/api/trpc/[trpc]/route.ts

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { createContext } from "@/server/api/trpc"; // Adjust this if needed!

const handler = (req: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc", // Must match your route folder
    req,
    router: appRouter,
    createContext,
  });
};

export async function GET(req: Request) {
  return handler(req);
}

export async function POST(req: Request) {
  return handler(req);
}
