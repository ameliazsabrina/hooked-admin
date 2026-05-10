import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginScreen } from "./login-screen";

const COOKIE_NAME =
  process.env.ADMIN_SESSION_COOKIE_NAME ?? "hooked-admin-session";

export default function HomePage() {
  const cookie = cookies().get(COOKIE_NAME)?.value;
  if (cookie) {
    try {
      const parsed = JSON.parse(cookie) as { token?: string };
      if (parsed?.token) redirect("/dashboard");
    } catch {
      // fall through to login
    }
  }
  return <LoginScreen />;
}
