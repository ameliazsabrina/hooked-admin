import { router } from "./trpc";
import { sessionRouter } from "./routers/session";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
  session: sessionRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;