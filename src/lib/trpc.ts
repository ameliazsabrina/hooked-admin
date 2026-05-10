import { createTRPCReact } from "@trpc/react-query";
import {
  createTRPCClient,
  httpBatchLink,
  splitLink,
  type TRPCLink,
} from "@trpc/client";
import { observable } from "@trpc/server/observable";
// The local stub `@/server/trpc/router` re-exports the real server's
// adminRouter type-wise (so admin.* shapes stay in sync) while keeping its
// own session cookie router for Next.js-internal session management.
import type { AppRouter } from "@/server/trpc/router";

// `admin.*` lives on the real @hooked/server (mongoose, fishing data, etc).
// `session.*` lives in the dashboard's own Next.js API route because it
// manages an HTTP-only cookie that only this Next.js process can set.
// We split the link by path prefix so each call lands on the right server.
const REMOTE_TRPC_URL =
  process.env.NEXT_PUBLIC_TRPC_URL ?? "http://localhost:3001/trpc";
const LOCAL_TRPC_URL = "/api/trpc";

export const trpc = createTRPCReact<AppRouter>();

const sessionExpiredLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) =>
    observable((observer) => {
      const sub = next(op).subscribe({
        next: (v) => observer.next(v),
        error: (err) => {
          if (
            err.data?.code === "UNAUTHORIZED" &&
            typeof window !== "undefined" &&
            !window.location.pathname.startsWith("/login") &&
            window.location.pathname !== "/"
          ) {
            window.location.href = "/";
          }
          observer.error(err);
        },
        complete: () => observer.complete(),
      });
      return sub;
    });
};

function buildLinks(opts: { token: string | null }) {
  const remote = httpBatchLink({
    url: REMOTE_TRPC_URL,
    headers: () =>
      opts.token ? { authorization: `Bearer ${opts.token}` } : {},
  });
  const local = httpBatchLink({ url: LOCAL_TRPC_URL });
  return [
    sessionExpiredLink,
    splitLink({
      condition: (op) => op.path.startsWith("session."),
      true: local,
      false: remote,
    }),
  ];
}

export function makeTrpcClient(opts: { token: string | null }) {
  return createTRPCClient<AppRouter>({ links: buildLinks(opts) });
}

export function trpcReactClientConfig(opts: { token: string | null }) {
  return { links: buildLinks(opts) };
}
