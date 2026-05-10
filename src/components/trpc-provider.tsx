"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { trpc, trpcReactClientConfig } from "@/lib/trpc";
import { readSessionFromCookie } from "@/lib/auth";

export function TrpcProvider({
  children,
  initialToken,
}: {
  children: React.ReactNode;
  initialToken: string | null;
}) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [queryClient] = useState(() => new QueryClient());
  const trpcClient = useMemo(
    () => trpc.createClient(trpcReactClientConfig({ token })),
    [token],
  );

  useEffect(() => {
    let cancelled = false;
    void readSessionFromCookie().then((s) => {
      if (cancelled) return;
      if (s.token !== token) setToken(s.token);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
