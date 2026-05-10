import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { TrpcProvider } from "@/components/trpc-provider";

const COOKIE_NAME =
  process.env.ADMIN_SESSION_COOKIE_NAME ?? "hooked-admin-session";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookie = cookies().get(COOKIE_NAME)?.value;
  let token: string | null = null;
  let wallet: string | null = null;
  if (cookie) {
    try {
      const parsed = JSON.parse(cookie) as { token?: string; wallet?: string };
      token = parsed.token ?? null;
      wallet = parsed.wallet ?? null;
    } catch {
      // ignore — will redirect below
    }
  }
  if (!token) redirect("/");

  return (
    <TrpcProvider initialToken={token}>
      <div className="flex h-screen w-screen bg-background">
        <Sidebar wallet={wallet} token={token} />
        <main className="flex-1 overflow-y-auto">
          <div className="container py-8 max-w-7xl">{children}</div>
        </main>
      </div>
    </TrpcProvider>
  );
}
