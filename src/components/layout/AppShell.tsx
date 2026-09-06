"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "cn";
import { MOBILE_NAV, NAV_ITEMS } from "./nav";
import { useApp } from "@/lib/store/AppProvider";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname === "";
  return pathname.startsWith(href.replace(/\/$/, ""));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready } = useApp();

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-14 items-center px-5 font-semibold tracking-tight">
          MyEnglish
        </div>
        <nav className="flex-1 space-y-0.5 px-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
                isActive(pathname, href) && "bg-sidebar-accent font-medium text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 text-xs text-muted-foreground">B1 → B2 → C1 / IELTS 7.0</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:hidden">
          <Link href="/" className="font-semibold tracking-tight">
            MyEnglish
          </Link>
          <Link href="/menu/" aria-label="Menu" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            <Menu className="size-5" />
          </Link>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-10 md:pt-8">
          {ready ? children : <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t bg-background/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {MOBILE_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground",
                isActive(pathname, href) && "text-foreground",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
