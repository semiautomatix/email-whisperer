"use client";

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/api/root";

// this is the trpc object for the Next.js app
export const trpc = createTRPCReact<AppRouter>();
