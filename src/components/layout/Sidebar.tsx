"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

const NAV = [
  { href: "/feed", label: "홈", auth: false },
  { href: "/community", label: "커뮤니티", auth: false },
  { href: "/board", label: "게시판", auth: false },
  { href: "/search", label: "검색", auth: false },
  { href: "/chat", label: "채팅", auth: true },
  { href: "/dday", label: "D-Day", auth: true },
  { href: "/timer", label: "타이머", auth: true },
  { href: "/groups", label: "스터디 그룹", auth: true },
  { href: "/notifications", label: "알림", auth: true },
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
    <aside className="hidden md:flex flex-col w-48 h-screen sticky top-0 border-r border-gray-100 bg-white">
      {/* Logo */}
      <div className="px-4 py-4">
        <Link href="/feed" className="flex items-center gap-2">
          <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
            <rect width="32" height="32" rx="8" fill="#533afd"/>
            <path d="M5 25V7h4.5l6.5 11 6.5-11H27v18h-4.5V14.5l-6 9-6-9V25H5z" fill="white"/>
          </svg>
          <span className="font-medium text-gray-900">monote</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-1 space-y-0.5">
        {NAV.filter((i) => !i.auth || !!user).map((item) => {
          const active = pathname === item.href || (item.href !== "/feed" && item.href !== "/search" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "block px-3 py-2 rounded-lg text-sm transition-colors",
                active ? "bg-[#eeeaff] text-[#533afd] font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {item.label}
            </Link>
          );
        })}

        {/* Grade filter */}
        {user && (
          <div className="pt-3 pb-1">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider px-3 mb-1.5">학년</p>
            <div className="flex gap-1 px-1">
              {[0, 1, 2, 3].map((g) => (
                <button key={g} onClick={() => setGrade(g as any)}
                  className={cn("flex-1 py-1 rounded text-xs font-medium transition-colors",
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
              "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mt-1",
              examMode ? "bg-amber-50 text-amber-700 font-medium" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            {examMode ? "⭐ 시험 직전 모드 ON" : "시험 직전 모드"}
          </button>
        )}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100 space-y-2">
        {user ? (
          <>
            <Link href="/post/new" className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#533afd] text-white text-sm font-medium hover:bg-[#4434d4] transition-colors">
              + 글 작성
            </Link>
            <p className="text-xs text-gray-400 truncate px-1">{user.nickname}</p>
            <button onClick={() => signOut({ callbackUrl: "/feed" })} className="text-xs text-gray-400 hover:text-gray-600 px-1">
              로그아웃
            </button>
          </>
        ) : (
          <div className="space-y-1.5">
            <Link href="/register" className="flex items-center justify-center w-full py-2 rounded-lg bg-[#533afd] text-white text-sm font-medium hover:bg-[#4434d4] transition-colors">
              무료 가입
            </Link>
            <Link href="/login" className="flex items-center justify-center w-full py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              로그인
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
