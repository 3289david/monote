"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/feed", label: "홈" },
  { href: "/community", label: "커뮤니티" },
  { href: "/post/new", label: "+", special: true },
  { href: "/search", label: "검색" },
  { href: "/profile", label: "내 정보" },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-100">
      <div className="flex items-center h-14 pb-safe">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/feed" && item.href !== "/search" && pathname.startsWith(item.href));

          if (item.special) {
            return (
              <Link key={item.href} href={getHref(item)} className="flex-1 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-[#533afd] flex items-center justify-center -mt-4 shadow-md shadow-[#533afd]/30">
                  <span className="text-white text-xl leading-none">+</span>
                </div>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={getHref(item)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium transition-colors",
                active ? "text-[#533afd]" : "text-gray-400"
              )}
            >
              <span className="text-[18px] leading-none">{item.href === "/feed" ? "🏠" : item.href === "/community" ? "👥" : item.href === "/search" ? "🔍" : "👤"}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
