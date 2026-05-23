"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

const NAV = [
  {
    href: "/feed",
    label: "홈",
    auth: false,
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 flex-shrink-0">
        <path d="M2 10.5L10 3l8 7.5V17a1 1 0 01-1 1H3a1 1 0 01-1-1v-6.5z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round"/>
        <path d="M7 18v-5h6v5" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/community",
    label: "커뮤니티",
    auth: false,
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 flex-shrink-0">
        <circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth={1.5}/>
        <path d="M1 17v-1a6 6 0 0112 0v1" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
        <circle cx="15" cy="6" r="2.5" stroke="currentColor" strokeWidth={1.5}/>
        <path d="M17 17v-1a5.5 5.5 0 00-3-4.9" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/board",
    label: "게시판",
    auth: false,
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 flex-shrink-0">
        <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth={1.5}/>
        <path d="M6 8h8M6 11h5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/search",
    label: "검색",
    auth: false,
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 flex-shrink-0">
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth={1.5}/>
        <path d="M18 18l-3.5-3.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/chat",
    label: "채팅",
    auth: true,
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 flex-shrink-0">
        <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v7a2 2 0 01-2 2H7l-4 3V5z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/dday",
    label: "D-Day",
    auth: true,
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 flex-shrink-0">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth={1.5}/>
        <path d="M10 5v5l3 3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/timer",
    label: "타이머",
    auth: true,
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 flex-shrink-0">
        <circle cx="10" cy="11" r="7" stroke="currentColor" strokeWidth={1.5}/>
        <path d="M10 7v4l2.5 2.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7.5 1.5h5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/groups",
    label: "스터디 그룹",
    auth: true,
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 flex-shrink-0">
        <path d="M10 3L3 7v6l7 4 7-4V7l-7-4z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round"/>
        <path d="M3 7l7 4M17 7l-7 4M10 11v6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/notifications",
    label: "알림",
    auth: true,
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 flex-shrink-0">
        <path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 00-6-6z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round"/>
        <path d="M8 15.5a2 2 0 004 0" stroke="currentColor" strokeWidth={1.5}/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const examMode = useUIStore((s) => s.examMode);
  const toggleExamMode = useUIStore((s) => s.toggleExamMode);
  const selectedGrade = useUIStore((s) => s.selectedGrade);
  const setGrade = useUIStore((s) => s.setGrade);
  const user = session?.user;

  return (
    <aside className="hidden md:flex flex-col w-52 h-screen sticky top-0 border-r border-gray-100 bg-white">
      {/* Logo */}
      <div className="px-4 py-4">
        <Link href="/feed" className="flex items-center gap-2.5">
          <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
            <rect width="32" height="32" rx="8" fill="#533afd"/>
            <path d="M5 25V7h4.5l6.5 11 6.5-11H27v18h-4.5V14.5l-6 9-6-9V25H5z" fill="white"/>
          </svg>
          <span className="font-semibold text-gray-900 tracking-tight">monote</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
        {NAV.filter((i) => !i.auth || !!user).map((item) => {
          const active = pathname === item.href || (item.href !== "/feed" && item.href !== "/search" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors",
                active
                  ? "bg-[#eeeaff] text-[#533afd] font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}

        {/* Grade filter */}
        {user && (
          <div className="pt-3 pb-1">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider px-3 mb-1.5">학년 필터</p>
            <div className="flex gap-1 px-1">
              {[0, 1, 2, 3].map((g) => (
                <button key={g} onClick={() => setGrade(g as any)}
                  className={cn("flex-1 py-1 rounded-lg text-xs font-medium transition-colors",
                    selectedGrade === g ? "bg-[#533afd] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}>
                  {g === 0 ? "전체" : `${g}학년`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Exam mode */}
        {user && (
          <button onClick={toggleExamMode}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors mt-1",
              examMode ? "bg-amber-50 text-amber-700 font-medium" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 flex-shrink-0">
              <path d="M10 1l2.4 5.3 5.6.5-4.1 3.8 1.3 5.4L10 13.3l-5.2 2.7 1.3-5.4L2 6.8l5.6-.5L10 1z"
                stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round"
                fill={examMode ? "currentColor" : "none"}/>
            </svg>
            {examMode ? "시험 직전 모드 ON" : "시험 직전 모드"}
          </button>
        )}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100 space-y-2">
        {user ? (
          <>
            <Link href="/post/new"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-[#533afd] text-white text-sm font-medium hover:bg-[#4434d4] transition-colors">
              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
              </svg>
              글 작성
            </Link>
            <div className="flex items-center gap-2 px-1">
              <div className="w-6 h-6 rounded-full bg-[#eeeaff] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 text-[#533afd]">
                  <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth={1.5}/>
                  <path d="M2 14v-.5a6 6 0 0112 0V14" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-xs text-gray-500 truncate">{user.nickname}</p>
              <button onClick={() => signOut({ callbackUrl: "/feed" })} className="ml-auto text-xs text-gray-400 hover:text-gray-600 flex-shrink-0">
                로그아웃
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-1.5">
            <Link href="/register"
              className="flex items-center justify-center w-full py-2 rounded-xl bg-[#533afd] text-white text-sm font-medium hover:bg-[#4434d4] transition-colors">
              무료 가입
            </Link>
            <Link href="/login"
              className="flex items-center justify-center w-full py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              로그인
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
