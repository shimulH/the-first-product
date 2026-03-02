import Link from "next/link";
import { MessageSquare, UserRoundCog, BarChart3, PlugZap, MessagesSquare, ClipboardList } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { SessionUser } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/messenger", label: "Messenger Inbox", icon: MessageSquare },
  { href: "/comments", label: "Comment Inbox", icon: MessagesSquare },
  { href: "/assignments", label: "Task Assignment", icon: ClipboardList },
  { href: "/team-members", label: "Team Members", icon: UserRoundCog },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/facebook-connection", label: "Facebook Connection", icon: PlugZap },
];

interface AppShellProps {
  pathname: string;
  user: SessionUser;
  children: ReactNode;
}

export function AppShell({ pathname, user, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 p-4 md:grid-cols-[260px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4">
          <h1 className="text-lg font-semibold">Social Inbox</h1>
          <p className="mt-1 text-sm text-slate-500">Phase 1 Facebook Operations</p>
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="success">Connected</Badge>
            <span className="text-xs text-slate-500">Role: {user.role}</span>
          </div>

          <nav className="mt-6 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100",
                    active && "bg-slate-100 font-medium text-slate-900",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="rounded-xl border border-slate-200 bg-white p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
