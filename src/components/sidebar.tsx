"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  Coins,
  Calendar,
  ScrollText,
  LogOut,
  Fish,
  Trophy,
  KeyRound,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { performAdminLogout } from "@/lib/auth";
import { truncatePubkey } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rooms", label: "Rooms", icon: Boxes, group: "On-chain (hooked_rooms)" },
  { href: "/lp", label: "LP", icon: Coins },
  {
    href: "/sessions",
    label: "Sessions",
    icon: Fish,
    group: "Off-chain (server)",
  },
  { href: "/catches", label: "Catches", icon: Trophy },
  { href: "/seeds", label: "Daily Seeds", icon: KeyRound },
  { href: "/reactions", label: "Reactions", icon: Activity },
  { href: "/events", label: "Events", icon: Calendar, group: "Admin" },
  { href: "/apex-fish", label: "Apex Fish", icon: Fish },
  { href: "/audit", label: "Audit Log", icon: ScrollText },
];

export function Sidebar({
  wallet,
  token,
}: {
  wallet: string | null;
  token: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-card">
      <div className="border-b px-5 py-4">
        <h1 className="text-base font-semibold">Hooked Admin</h1>
        <p className="text-xs text-muted-foreground">Ops dashboard</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <div key={item.href}>
              {item.group && (
                <p className="mt-3 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {item.group}
                </p>
              )}
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="border-t p-3 space-y-2">
        <div className="rounded-md bg-muted px-3 py-2 text-xs">
          <div className="text-muted-foreground">Signed in as</div>
          <div className="font-mono">{truncatePubkey(wallet, 6)}</div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={async () => {
            await performAdminLogout(token);
            router.replace("/");
          }}
        >
          <LogOut className="mr-2 h-3 w-3" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
