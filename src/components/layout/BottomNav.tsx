"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/feed",
    label: "홈",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
          stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinejoin="round"
          fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0}/>
        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/community",
    label: "커뮤니티",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round"
          fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.1 : 0}/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
          fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.1 : 0}/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/post/new",
    label: "작성",
    icon: (_active: boolean) => (
      <div className="w-12 h-12 rounded-full bg-[#533afd] flex items-center justify-center shadow-lg shadow-[#533afd]/40 -mt-5">
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"/>
        </svg>
      </div>
    ),
    special: true,
  },
  {
    href: "/search",
    label: "검색",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
          fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.1 : 0}/>
        <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "내 정보",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
          fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0}/>
        <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  // Profile item links to login if not logged in
  const getHref = (item: typeof NAV_ITEMS[0]) => {
    if (item.href === "/post/new" && !isLoggedIn) return "/login?callbackUrl=/post/new";
    if (item.href === "/profile" && !isLoggedIn) return "/login";
    return item.href;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-white/95 backdrop-blur-xl border-t border-[#e3e8ee]" />
      <div className="relative flex items-center justify-around px-2 pb-safe-bottom pt-1 h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/feed" && item.href !== "/search" && pathname.startsWith(item.href));

          if (item.special) {
            return (
              <Link key={item.href} href={getHref(item)} className="flex flex-col items-center gap-0.5 flex-1">
                {item.icon(isActive)}
                <span className="text-[10px] text-[#64748d] mt-1">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={getHref(item)}
              className={cn("flex flex-col items-center gap-0.5 flex-1 transition-colors", isActive ? "text-[#533afd]" : "text-[#64748d]")}
            >
              {item.icon(isActive)}
              <span className={cn("text-[10px] font-medium", isActive ? "text-[#533afd]" : "text-[#64748d]")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
