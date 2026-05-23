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

function IconSearch({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7}/>
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round"/>
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
  { href: "/search", label: "검색", Icon: IconSearch },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-sm border-t border-gray-100">
      <div className="flex items-center h-14 pb-safe">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/feed" && item.href !== "/search" && pathname.startsWith(item.href));

          if (item.special) {
            return (
              <Link key={item.href} href={getHref(item)} className="flex-1 flex flex-col items-center justify-center">
                <div className="w-11 h-11 rounded-full bg-[#533afd] flex items-center justify-center -mt-5 shadow-lg shadow-[#533afd]/40">
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
                "flex-1 flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium transition-colors",
                active ? "text-[#533afd]" : "text-gray-400"
              )}
            >
              <Icon active={active} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
