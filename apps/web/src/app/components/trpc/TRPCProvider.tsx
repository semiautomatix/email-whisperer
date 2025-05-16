"use client";

import { trpc } from "@/app/trpc/utils";
import { httpBatchLink } from "@trpc/client";
import { QueryClient } from "@tanstack/react-query";
import { FC, ReactNode, useState } from "react";

export const TRPCProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
        }),
      ],
    }),
  );

  // createTRPCReact` from "@trpc/react-query" (as seen in your utils.ts file), which in newer versions internally handles the React Query setup and doesn't require <QueryClientProvider />
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  );
};
