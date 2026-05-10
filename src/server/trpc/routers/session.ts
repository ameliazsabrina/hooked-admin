import { z } from "zod";
import { router, procedure } from "../trpc";
import { NextResponse } from "next/server";

const sessionSchema = z.object({
  token: z.string(),
  wallet: z.string(),
  expiresAt: z.string(),
});

export const sessionRouter = router({
  create: procedure
    .input(sessionSchema)
    .mutation(async ({ input, ctx }) => {
      const expires = new Date(input.expiresAt);

      ctx.cookies.set({
        name: ctx.cookieName,
        value: JSON.stringify({
          token: input.token,
          wallet: input.wallet
        }),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires,
        path: "/",
      });

      return { ok: true };
    }),

  get: procedure
    .query(async ({ ctx }) => {
      const raw = ctx.cookies.get(ctx.cookieName)?.value;

      if (!raw) {
        return { token: null, wallet: null };
      }

      try {
        const parsed = JSON.parse(raw) as { token: string; wallet: string };
        return parsed;
      } catch {
        return { token: null, wallet: null };
      }
    }),

  delete: procedure
    .mutation(async ({ ctx }) => {
      ctx.cookies.delete(ctx.cookieName);
      return { ok: true };
    }),
});