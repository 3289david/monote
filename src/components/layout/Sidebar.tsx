"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import Avatar from "@/components/ui/Avatar";

const MAIN_NAV = [
  {
    href: "/feed", label: "홈",
    icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round"/><path d="M9 21V12h6v9" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/></svg>,
  },
  {
    href: "/board", label: "게시판",
    icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth={1.8}/><path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/></svg>,
  },
  {
    href: "/community", label: "커뮤니티",
    icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={1.8}/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/></svg>,
  },
  {
    href: "/search", label: "검색",
    icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={1.8}/><path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/></svg>,
  },
  {
    href: "/chat", label: "채팅",
    icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round"/></svg>,
    requiresAuth: true,
  },
  {
    href: "/dday", label: "D-Day",
    icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={1.8}/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/></svg>,
    requiresAuth: true,
  },
  {
    href: "/timer", label: "공부 타이머",
    icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth={1.8}/><path d="M12 9v4l3 3M12 5V3M9 3h6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/></svg>,
    requiresAuth: true,
  },
  {
    href: "/groups", label: "스터디 그룹",
    icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={1.8}/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth={1.8}/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.85" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/></svg>,
    requiresAuth: true,
  },
  {
    href: "/notifications", label: "알림",
    icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>,
    requiresAuth: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const selectedGrade = useUIStore((s) => s.selectedGrade);
  const setGrade = useUIStore((s) => s.setGrade);
  const examMode = useUIStore((s) => s.examMode);
  const toggleExamMode = useUIStore((s) => s.toggleExamMode);
  const user = session?.user;

  const visibleItems = MAIN_NAV.filter((item) => !item.requiresAuth || !!user);

  return (
    <aside className={cn(
      "hidden md:flex flex-col w-56 h-screen sticky top-0 border-r overflow-y-auto",
      examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]"
    )}>
      {/* Logo */}
      <div className={cn("px-5 py-4 border-b", examMode ? "border-[#2a2d6b]" : "border-[#e3e8ee]")}>
        <Link href="/feed" className="flex items-center gap-2.5">
          <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
            <rect width="32" height="32" rx="8" fill="#533afd"/>
            <path d="M5 25V7h4.5l6.5 11 6.5-11H27v18h-4.5V14.5l-6 9-6-9V25H5z" fill="white"/>
          </svg>
          <span className={cn("font-light text-xl", examMode ? "text-white" : "text-[#0d253d]")} style={{ letterSpacing: "-0.5px" }}>monote</span>
        </Link>
      </div>

      {/* User card */}
      {user ? (
        <Link href="/profile" className={cn("mx-3 mt-3 p-3 rounded-xl flex items-center gap-2.5 transition-colors", examMode ? "bg-[#2a2d6b] hover:bg-[#363996]" : "bg-[#f6f9fc] hover:bg-[#eeeaff]")}>
          <Avatar nickname={user.nickname} level={user.level} size="sm" imageUrl={user.image ?? undefined} />
          <div className="min-w-0 flex-1">
            <p className={cn("text-sm font-medium truncate", examMode ? "text-white" : "text-[#0d253d]")}>{user.nickname}</p>
            <p className={cn("text-xs truncate", examMode ? "text-white/50" : "text-[#64748d]")}>{user.schoolName}</p>
          </div>
        </Link>
      ) : (
        <div className={cn("mx-3 mt-3 p-3 rounded-xl", examMode ? "bg-[#2a2d6b]" : "bg-[#f6f9fc]")}>
          <p className={cn("text-xs mb-2", examMode ? "text-white/60" : "text-[#64748d]")}>로그인 후 더 많은 기능을</p>
          <div className="flex gap-1.5">
            <Link href="/login" className="flex-1 py-1.5 text-center text-xs bg-[#533afd] text-white rounded-lg hover:bg-[#4434d4] transition-colors">로그인</Link>
            <Link href="/register" className={cn("flex-1 py-1.5 text-center text-xs rounded-lg border transition-colors", examMode ? "border-[#363996] text-white/70 hover:bg-[#363996]" : "border-[#e3e8ee] text-[#273951] hover:bg-white")}>가입</Link>
          </div>
        </div>
      )}

      {/* Main nav */}
      <nav className="mt-2 px-2 flex-1">
        {visibleItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/feed" && item.href !== "/search" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors",
                active
                  ? examMode ? "bg-[#533afd]/30 text-[#b9b9f9]" : "bg-[#eeeaff] text-[#533afd]"
                  : examMode ? "text-white/60 hover:bg-[#2a2d6b] hover:text-white" : "text-[#273951] hover:bg-[#f6f9fc]"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Grade filter - only for logged-in users */}
        {user && (
          <div className={cn("mt-3 mb-1 mx-1 border-t pt-3", examMode ? "border-[#2a2d6b]" : "border-[#e3e8ee]")}>
            <p className={cn("text-[10px] font-medium uppercase tracking-wider mb-2 px-1", examMode ? "text-white/40" : "text-[#64748d]")}>학년 필터</p>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((g) => (
                <button key={g} onClick={() => setGrade(g as any)}
                  className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                    selectedGrade === g
                      ? "bg-[#533afd] text-white"
                      : examMode ? "bg-[#2a2d6b] text-white/60 hover:bg-[#363996]" : "bg-[#f6f9fc] text-[#273951] hover:bg-[#eeeaff]"
                  )}>
                  {g === 0 ? "전체" : `${g}학년`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Exam mode toggle */}
        {user && (
          <div className={cn("mt-2 mb-1 mx-1")}>
            <button
              onClick={toggleExamMode}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors",
                examMode
                  ? "bg-amber-400/20 text-amber-400"
                  : "text-[#64748d] hover:bg-[#f6f9fc]"
              )}
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"
                  stroke="currentColor" strokeWidth={1.8} fill={examMode ? "currentColor" : "none"}/>
              </svg>
              <span>{examMode ? "⭐ 시험 직전 모드 ON" : "시험 직전 모드"}</span>
            </button>
          </div>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 space-y-2">
        {user ? (
          <>
            <Link href="/post/new"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-[#533afd] text-white text-sm hover:bg-[#4434d4] transition-colors">
              <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/></svg>
              글 작성하기
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/feed" })}
              className={cn("w-full py-2 text-xs transition-colors", examMode ? "text-white/30 hover:text-white/60" : "text-[#64748d] hover:text-[#273951]")}
            >
              로그아웃
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <Link href="/register"
              className="flex items-center justify-center w-full py-2.5 rounded-full bg-[#533afd] text-white text-sm hover:bg-[#4434d4] transition-colors">
              무료로 시작하기
            </Link>
            <Link href="/terms" className={cn("block text-center text-xs", examMode ? "text-white/30" : "text-[#64748d]")}>
              이용약관 · 개인정보처리방침
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
