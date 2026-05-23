"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

function IconHome({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconCommunity({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round"/>
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7}/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round"/>
    </svg>
  );
}

function IconChat({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconProfile({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7}/>
      <path d="M4 21v-1a8 8 0 0116 0v1" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round"/>
    </svg>
  );
}

const NAV = [
  { href: "/feed", label: "홈", Icon: IconHome },
  { href: "/community", label: "커뮤니티", Icon: IconCommunity },
  { href: "/post/new", label: "+", special: true, Icon: null },
  { href: "/chat", label: "채팅", Icon: IconChat },
  { href: "/profile", label: "내 정보", Icon: IconProfile },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const getHref = (item: typeof NAV[0]) => {
    if (item.href === "/post/new" && !user) return "/login?callbackUrl=/post/new";
    if (item.href === "/profile" && !user) return "/login";
    return item.href;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Top fade edge */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#e3e8ee] to-transparent" />
      <div className="bg-white/96 backdrop-blur-xl border-t border-[#e3e8ee]/60"
        style={{ boxShadow: "0 -1px 0 rgba(0,55,112,0.04), 0 -8px 24px rgba(0,55,112,0.04)" }}>
        <div className="flex items-center h-[60px] pb-safe px-1">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/feed" && item.href !== "/chat" && item.href !== "/search" && pathname.startsWith(item.href));

            if (item.special) {
              return (
                <Link key={item.href} href={getHref(item)} className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#533afd] flex items-center justify-center -mt-7 transition-transform active:scale-90"
                    style={{ boxShadow: "0 4px 16px rgba(83,58,253,0.45), 0 1px 4px rgba(83,58,253,0.3)" }}>
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                      <path d="M12 5v14M5 12h14" stroke="white" strokeWidth={2.5} strokeLinecap="round"/>
                    </svg>
                  </div>
                </Link>
              );
            }

            const Icon = item.Icon!;
            return (
              <Link key={item.href} href={getHref(item)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all duration-150",
                  active ? "text-[#533afd]" : "text-[#64748d]"
                )}
              >
                {/* Active indicator dot */}
                <div className={cn(
                  "relative flex items-center justify-center transition-all duration-200",
                  active && "after:absolute after:-top-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-[#533afd]"
                )}>
                  <Icon active={active} />
                </div>
                <span className={cn(
                  "text-[10px] tracking-tight transition-all duration-150",
                  active ? "font-semibold" : "font-normal"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
