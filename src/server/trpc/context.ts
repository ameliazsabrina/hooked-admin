import { cookies } from "next/headers";

const COOKIE_NAME =
  process.env.ADMIN_SESSION_COOKIE_NAME ?? "hooked-admin-session";

export function createContext(req: Request) {
  return {
    req,
    cookies: cookies(),
    cookieName: COOKIE_NAME,
  };
}

export type Context = ReturnType<typeof createContext>;