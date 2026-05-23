"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Avatar from "@/components/ui/Avatar";
import { useQuery } from "@tanstack/react-query";

const PAGE_TITLES: Record<string, string> = {
  "/board": "게시판", "/chat": "채팅", "/profile": "내 정보",
  "/search": "검색", "/dday": "D-Day", "/timer": "공부 타이머",
  "/groups": "스터디 그룹", "/notifications": "알림", "/community": "커뮤니티",
};

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const isHome = pathname === "/feed" || pathname === "/community";
  const title = PAGE_TITLES[pathname] ?? "";

  const { data: notifData } = useQuery({
    queryKey: ["unread-notif"],
    queryFn: () => fetch("/api/notifications").then((r) => r.json()),
    refetchInterval: 30000,
    enabled: !!user,
  });
  const unreadCount = notifData?.unreadCount ?? 0;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="flex items-center h-12 px-4 max-w-2xl mx-auto">
        {/* Left */}
        {isHome ? (
          <Link href="/feed" className="flex items-center gap-1.5 mr-auto">
            <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
              <rect width="32" height="32" rx="8" fill="#533afd"/>
              <path d="M5 25V7h4.5l6.5 11 6.5-11H27v18h-4.5V14.5l-6 9-6-9V25H5z" fill="white"/>
            </svg>
            <span className="font-medium text-gray-900 text-sm">monote</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2 mr-auto">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 p-1 -ml-1">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {title && <span className="font-medium text-gray-900 text-sm">{title}</span>}
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-1">
          {user ? (
            <>
              <Link href="/notifications" className="relative p-2 text-gray-500 hover:text-gray-900">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/profile">
                <Avatar nickname={user.nickname} level={user.level} size="sm" imageUrl={user.image ?? undefined} />
              </Link>
            </>
          ) : (
            <Link href="/login" className="text-xs px-3 py-1.5 bg-[#533afd] text-white rounded-full font-medium">
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
