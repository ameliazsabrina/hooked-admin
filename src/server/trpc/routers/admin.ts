// Type passthrough to the real server's admin router. The dashboard's
// runtime tRPC client routes admin.* requests over HTTP to the real server
// at NEXT_PUBLIC_TRPC_URL, so we never actually execute these resolvers
// locally — they exist only so TypeScript can infer the response shapes.
//
// We only import the *type* of the real router so webpack doesn't try to
// bundle the server's mongoose/fs/etc. imports (which use `.js` ESM
// extensions that Next.js webpack can't resolve). The runtime value is a
// stub: an empty router cast to the real router's type. The local API
// route at `/api/trpc` would 404 on `admin.*` calls, but that's fine —
// admin requests are sent to NEXT_PUBLIC_TRPC_URL, never here.
import type { adminRouter as RealAdminRouter } from "@hooked/server/trpc/adminRouter";
import { router } from "../trpc";

export const adminRouter = router({}) as unknown as typeof RealAdminRouter;
