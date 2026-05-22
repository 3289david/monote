"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import Avatar from "@/components/ui/Avatar";
import { getLevelColor, getLevelName } from "@/lib/utils";

const SUBJECTS = [
  "국어", "수학", "영어", "과학", "사회",
  "역사", "물리", "화학", "생명과학", "지구과학",
  "한국사", "음악", "미술", "체육", "기술가정", "정보",
];

const MAIN_NAV = [
  {
    href: "/feed", label: "홈",
    icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round"/><path d="M9 21V12h6v9" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/></svg>,
  },
  {
    href: "/board", label: "전체 게시판",
    icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth={1.8}/><path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/></svg>,
  },
  {
    href: "/community", label: "커뮤니티",
    icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth={1.8}/><circle cx="15" cy="15" r="3" stroke="currentColor" strokeWidth={1.8}/><path d="M12 3c5 0 9 4 9 9s-4 9-9 9S3 17 3 12 7 3 12 3z" stroke="currentColor" strokeWidth={1.8}/></svg>,
  },
  {
    href: "/chat", label: "채팅",
    icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round"/></svg>,
  },
  {
    href: "/dday", label: "D-Day",
    icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={1.8}/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/></svg>,
  },
  {
    href: "/timer", label: "공부 타이머",
    icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth={1.8}/><path d="M12 9v4l3 3M12 5V3M9 3h6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/></svg>,
  },
  {
    href: "/groups", label: "스터디 그룹",
    icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={1.8}/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth={1.8}/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.85" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/></svg>,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const examMode = useUIStore((s) => s.examMode);
  const selectedGrade = useUIStore((s) => s.selectedGrade);
  const setGrade = useUIStore((s) => s.setGrade);

  const user = session?.user;

  return (
    <aside className={cn(
      "hidden md:flex flex-col w-60 h-screen sticky top-0 border-r overflow-y-auto transition-colors",
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

      {/* User mini card */}
      {user && (
        <Link href="/profile" className={cn("mx-3 mt-3 p-3 rounded-xl flex items-center gap-2.5", examMode ? "bg-[#2a2d6b]" : "bg-[#f6f9fc]")}>
          <Avatar nickname={user.nickname} level={user.level} size="sm" imageUrl={user.image ?? undefined} />
          <div className="min-w-0 flex-1">
            <p className={cn("text-sm font-medium truncate", examMode ? "text-white" : "text-[#0d253d]")}>{user.nickname}</p>
            <p className={cn("text-xs", examMode ? "text-white/50" : "text-[#64748d]")}>
              <span className={getLevelColor(user.level)}>{getLevelName(user.level)}</span> · {user.points?.toLocaleString()}P
            </p>
          </div>
        </Link>
      )}

      {/* Main nav */}
      <nav className="mt-2 px-2 flex-1">
        {MAIN_NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/feed" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors",
                active
                  ? examMode ? "bg-[#533afd] text-white" : "bg-[#eeeaff] text-[#533afd]"
                  : examMode ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-[#273951] hover:bg-[#f6f9fc]"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Grade + subjects */}
        <div className={cn("mt-3 mb-1 mx-1 border-t pt-3", examMode ? "border-[#2a2d6b]" : "border-[#e3e8ee]")}>
          <p className={cn("text-[10px] font-medium uppercase tracking-wider mb-2 px-1", examMode ? "text-white/40" : "text-[#64748d]")}>학년 선택</p>
          <div className="flex gap-1.5 mb-3">
            {[1, 2, 3].map((g) => (
              <button key={g} onClick={() => setGrade(g)}
                className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                  selectedGrade === g ? "bg-[#533afd] text-white" : examMode ? "bg-[#2a2d6b] text-white/60 hover:bg-[#363996]" : "bg-[#f6f9fc] text-[#273951] hover:bg-[#eeeaff]"
                )}>{g}학년</button>
            ))}
          </div>

          <p className={cn("text-[10px] font-medium uppercase tracking-wider mb-2 px-1", examMode ? "text-white/40" : "text-[#64748d]")}>과목</p>
          {SUBJECTS.map((subj) => (
            <Link key={subj} href={`/board?grade=${selectedGrade}&subject=${encodeURIComponent(subj)}`}
              className={cn("block px-3 py-1.5 rounded-lg text-sm transition-colors",
                pathname.includes(encodeURIComponent(subj))
                  ? examMode ? "bg-[#533afd] text-white" : "bg-[#eeeaff] text-[#533afd]"
                  : examMode ? "text-white/60 hover:bg-white/10" : "text-[#273951] hover:bg-[#f6f9fc]"
              )}>{subj}</Link>
          ))}
        </div>
      </nav>

      {/* Write + logout */}
      <div className="p-3 space-y-2">
        <Link href="/post/new"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-[#533afd] text-white text-sm hover:bg-[#4434d4] transition-colors">
          <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/></svg>
          글 작성하기
        </Link>
      </div>
    </aside>
  );
}
