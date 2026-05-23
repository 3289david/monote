"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Avatar from "@/components/ui/Avatar";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

const PAGE_TITLES: Record<string, string> = {
  "/feed": "홈", "/board": "게시판", "/chat": "채팅",
  "/profile": "내 정보", "/search": "검색",
  "/dday": "D-Day", "/timer": "공부 타이머", "/groups": "스터디 그룹",
  "/notifications": "알림", "/community": "커뮤니티",
};

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const examMode = useUIStore((s) => s.examMode);
  const toggleExamMode = useUIStore((s) => s.toggleExamMode);
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
    <header className={cn(
      "sticky top-0 z-40 border-b backdrop-blur-xl",
      examMode ? "bg-[#1c1e54]/95 border-[#2a2d6b]" : "bg-white/90 border-[#e3e8ee]"
    )}>
      <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">
        {isHome ? (
          <Link href="/feed" className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
              <rect width="32" height="32" rx="8" fill="#533afd"/>
              <path d="M5 25V7h4.5l6.5 11 6.5-11H27v18h-4.5V14.5l-6 9-6-9V25H5z" fill="white"/>
            </svg>
            <span className={cn("font-light text-lg", examMode ? "text-white" : "text-[#0d253d]")} style={{ letterSpacing: "-0.5px" }}>monote</span>
          </Link>
        ) : (
          <button onClick={() => router.back()} className={cn("p-1 -ml-1 rounded-lg", examMode ? "text-white/70" : "text-[#64748d]")}>
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {!isHome && title && (
          <h1 className={cn("absolute left-1/2 -translate-x-1/2 font-light text-base", examMode ? "text-white" : "text-[#0d253d]")}>{title}</h1>
        )}

        <div className="flex items-center gap-1">
          {/* Search (hidden on search page) */}
          {pathname !== "/search" && (
            <Link href="/search" className={cn("p-1.5 rounded-lg", examMode ? "text-white/60 hover:text-white" : "text-[#64748d] hover:text-[#0d253d]")}>
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={1.8}/>
                <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/>
              </svg>
            </Link>
          )}

          {user && (
            <>
              {/* Exam mode toggle */}
              <button
                onClick={toggleExamMode}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-bold transition-colors",
                  examMode ? "text-amber-400 bg-amber-400/10" : "text-[#64748d] hover:text-[#0d253d]"
                )}
                title={examMode ? "시험 직전 모드 끄기" : "시험 직전 모드 켜기"}
              >
                {examMode ? "⭐" : (
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>

              {/* Notifications */}
              <Link href="/notifications" className={cn("p-1.5 rounded-lg relative", examMode ? "text-white/60 hover:text-white" : "text-[#64748d] hover:text-[#0d253d]")}>
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Avatar */}
              <Link href="/profile">
                <Avatar nickname={user.nickname} level={user.level} size="sm" imageUrl={user.image ?? undefined} />
              </Link>
            </>
          )}

          {!user && (
            <Link href="/login" className="text-xs px-3 py-1.5 bg-[#533afd] text-white rounded-full font-medium hover:bg-[#4434d4] transition-colors">
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
