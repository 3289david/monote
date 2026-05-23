"use client";
import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePosts } from "@/hooks/usePosts";
import PostCard from "@/components/posts/PostCard";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { PostCategory } from "@/types";

const CATEGORIES: { value: PostCategory | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "exam_range", label: "시험범위" },
  { value: "performance", label: "수행평가" },
  { value: "materials", label: "자료" },
  { value: "teacher_info", label: "선생님" },
  { value: "question", label: "질문" },
];

const QUICK_ACTIONS = [
  {
    href: "/dday",
    label: "D-Day",
    desc: "시험까지",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.5}/>
        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: "bg-amber-50 text-amber-600",
    accent: "#f59e0b",
  },
  {
    href: "/timer",
    label: "타이머",
    desc: "집중 모드",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth={1.5}/>
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
        <path d="M9 2h6" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
      </svg>
    ),
    color: "bg-rose-50 text-rose-500",
    accent: "#ea2261",
  },
  {
    href: "/groups",
    label: "스터디",
    desc: "그룹 모임",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={1.5}/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
      </svg>
    ),
    color: "bg-violet-50 text-violet-600",
    accent: "#7c3aed",
  },
  {
    href: "/search",
    label: "검색",
    desc: "바로 찾기",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={1.5}/>
        <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
      </svg>
    ),
    color: "bg-indigo-50 text-[#533afd]",
    accent: "#533afd",
  },
  {
    href: "/notes",
    label: "노트",
    desc: "내 메모",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <rect x="4" y="2" width="16" height="20" rx="3" stroke="currentColor" strokeWidth={1.5}/>
        <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
      </svg>
    ),
    color: "bg-emerald-50 text-emerald-600",
    accent: "#059669",
  },
];

export default function FeedPage() {
  const { data: session } = useSession();
  const examMode = useUIStore((s) => s.examMode);
  const toggleExamMode = useUIStore((s) => s.toggleExamMode);
  const selectedGrade = useUIStore((s) => s.selectedGrade);
  const [activeCategory, setActiveCategory] = useState<PostCategory | "all">("all");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "hot">("latest");
  const [scope, setScope] = useState<"school" | "all">("school");

  // Pull-to-refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pullDistance = useRef(0);
  const [pullIndicator, setPullIndicator] = useState(0);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = usePosts({
    grade: selectedGrade || undefined,
    category: activeCategory === "all" ? undefined : activeCategory,
    sortBy,
    examMode,
    scope,
  });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];
  const pinnedPosts = posts.filter((p: any) => p.isPinned);
  const regularPosts = posts.filter((p: any) => !p.isPinned);
  const user = session?.user;

  const handleTouchStart = useCallback((e: React.TouchEvent) => { startY.current = e.touches[0].clientY; }, []);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if ((e.currentTarget as HTMLElement).scrollTop > 0) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) { pullDistance.current = dy; setPullIndicator(Math.min(dy / 80, 1)); }
  }, []);
  const handleTouchEnd = useCallback(async () => {
    if (pullDistance.current > 80 && !isRefreshing) {
      setIsRefreshing(true);
      if (navigator.vibrate) navigator.vibrate(20);
      await refetch();
      setIsRefreshing(false);
    }
    pullDistance.current = 0; setPullIndicator(0);
  }, [isRefreshing, refetch]);

  return (
    <div className="space-y-3" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Pull-to-refresh */}
      {(pullIndicator > 0 || isRefreshing) && (
        <div className="flex justify-center py-1">
          <div className={cn("w-6 h-6 rounded-full border-2 border-[#533afd] border-t-transparent", isRefreshing && "animate-spin")}
            style={{ opacity: pullIndicator || (isRefreshing ? 1 : 0) }} />
        </div>
      )}

      {/* ── Gradient Hero ── */}
      <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: "240px" }}>
        {/* Deep gradient mesh — cream → magenta → lavender → indigo → brand-dark */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(140deg, #f5e9d4 0%, #fcd9b0 12%, #f96bee 32%, #c4b8fc 54%, #533afd 74%, #2e2b8c 88%, #1c1e54 100%)",
        }} />

        {/* Atmospheric mesh blobs */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 420 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          {/* Large ambient ellipses */}
          <ellipse cx="360" cy="30" rx="160" ry="110" fill="white" fillOpacity="0.06"/>
          <ellipse cx="50" cy="200" rx="110" ry="85" fill="white" fillOpacity="0.05"/>
          <ellipse cx="210" cy="130" rx="230" ry="80" fill="white" fillOpacity="0.035"/>
          {/* Ruby accent blobs */}
          <circle cx="380" cy="185" r="65" fill="#ea2261" fillOpacity="0.22"/>
          <circle cx="28" cy="50" r="52" fill="#f96bee" fillOpacity="0.18"/>
          {/* Subtle shimmer bands */}
          <ellipse cx="200" cy="15" rx="180" ry="28" fill="white" fillOpacity="0.08"/>
          <ellipse cx="200" cy="245" rx="140" ry="22" fill="#1c1e54" fillOpacity="0.25"/>
        </svg>

        {/* Geometric accent — thin diamond lines */}
        <svg className="absolute top-3 right-4 w-28 h-28 text-white/10" viewBox="0 0 112 112" fill="none">
          <rect x="28" y="28" width="56" height="56" rx="4" stroke="currentColor" strokeWidth="1" transform="rotate(45 56 56)"/>
          <rect x="36" y="36" width="40" height="40" rx="3" stroke="currentColor" strokeWidth="0.75" transform="rotate(45 56 56)"/>
          <circle cx="56" cy="56" r="6" fill="currentColor" fillOpacity="0.5"/>
        </svg>
        {/* Small dot grid bottom-left */}
        <svg className="absolute bottom-4 left-4 w-16 h-16 text-white/12" viewBox="0 0 64 64" fill="none">
          {[0,16,32,48].map(x => [0,16,32,48].map(y => (
            <circle key={`${x}-${y}`} cx={x+8} cy={y+8} r="2" fill="currentColor"/>
          )))}
        </svg>

        {/* Content */}
        <div className="relative z-10 px-5 pt-6 pb-5">
          {user ? (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                <p className="text-white/75 text-xs font-light tracking-wide">
                  {user.nickname}님, 안녕하세요
                </p>
              </div>
              <h2 className="text-white text-2xl font-light mb-5" style={{ letterSpacing: "-0.5px", lineHeight: 1.15 }}>
                오늘도 함께<br/>공부해요
              </h2>
              {/* Quick action cards */}
              <div className="grid grid-cols-5 gap-1.5">
                {QUICK_ACTIONS.map((action) => (
                  <Link key={action.href} href={action.href}
                    className="group flex flex-col items-center gap-1.5 bg-white/88 backdrop-blur-md rounded-2xl py-3 px-1 hover:bg-white active:scale-95 transition-all duration-150"
                    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)" }}>
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-active:scale-90", action.color)}>
                      {action.icon}
                    </div>
                    <span className="text-[10px] font-semibold text-[#0d253d] leading-tight tracking-tight text-center">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-end justify-between min-h-[170px]">
              <div className="flex-1">
                {/* Eyebrow pill */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 mb-3">
                  <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5 text-white/80">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M4 6h4M6 4v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[10px] font-medium text-white/80 tracking-widest uppercase">학교 정보 공유</span>
                </div>
                <h2 className="text-white text-2xl font-light mb-4" style={{ letterSpacing: "-0.5px", lineHeight: 1.15 }}>
                  monote에<br/>오신 걸 환영해요
                </h2>
                <div className="flex gap-2">
                  <Link href="/register"
                    className="px-5 py-2 bg-white text-[#533afd] text-sm font-medium rounded-full hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                    무료 시작
                  </Link>
                  <Link href="/login"
                    className="px-5 py-2 bg-white/15 text-white text-sm font-light rounded-full hover:bg-white/25 transition-colors border border-white/25">
                    로그인
                  </Link>
                </div>
              </div>
              {/* Decorative note-stack illustration */}
              <svg viewBox="0 0 88 96" fill="none" className="w-22 h-24 flex-shrink-0 ml-4 opacity-85">
                <rect x="6" y="20" width="52" height="66" rx="8" fill="white" fillOpacity="0.18"/>
                <rect x="14" y="10" width="52" height="66" rx="8" fill="white" fillOpacity="0.28"/>
                <rect x="22" y="2" width="52" height="66" rx="8" fill="white" fillOpacity="0.4"/>
                <rect x="30" y="14" width="32" height="2.5" rx="1.25" fill="white" fillOpacity="0.75"/>
                <rect x="30" y="21" width="24" height="2" rx="1" fill="white" fillOpacity="0.6"/>
                <rect x="30" y="27" width="28" height="2" rx="1" fill="white" fillOpacity="0.6"/>
                <rect x="30" y="33" width="20" height="2" rx="1" fill="white" fillOpacity="0.5"/>
                <circle cx="64" cy="62" r="18" fill="#f96bee" fillOpacity="0.55"/>
                <path d="M59 62h10M64 57v10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Exam mode bar */}
      {examMode && (
        <div className="flex items-center justify-between px-3 py-2 bg-indigo-950 text-white rounded-xl text-sm">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-400">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <span>시험 직전 모드 — 중요 글만 표시</span>
          </div>
          <button onClick={toggleExamMode} className="text-white/60 hover:text-white text-xs">끄기</button>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-2">
        {/* School / All scope toggle */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-full p-0.5 bg-gray-100 gap-0.5">
            {(["school", "all"] as const).map((s) => (
              <button key={s} onClick={() => setScope(s)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all",
                  scope === s ? "bg-[#533afd] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}>
                {s === "school" ? (
                  <span className="flex items-center gap-1">
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                      <path d="M1 5l5-3.5L11 5v6H7V8H5v3H1V5z" stroke="currentColor" strokeWidth={1.2} strokeLinejoin="round"/>
                    </svg>
                    우리 학교
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth={1.2}/>
                      <path d="M1 6h10M6 1c-1.5 1.5-2.5 3-2.5 5s1 3.5 2.5 5M6 1c1.5 1.5 2.5 3 2.5 5S7.5 9.5 6 11" stroke="currentColor" strokeWidth={1.2}/>
                    </svg>
                    전체
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {CATEGORIES.map((f) => (
            <button key={f.value} onClick={() => setActiveCategory(f.value)}
              className={cn(
                "flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                activeCategory === f.value
                  ? "bg-[#533afd] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[#533afd]"
              )}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {isLoading ? "불러오는 중..." : `${posts.length}개`}
          </span>
          <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-full">
            {(["latest", "popular", "hot"] as const).map((s) => (
              <button key={s} onClick={() => setSortBy(s)}
                className={cn("text-xs px-2.5 py-1 rounded-full transition-colors",
                  sortBy === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                )}>
                {s === "latest" ? "최신" : s === "popular" ? "인기" : "핫"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-3 animate-pulse">
              <div className="h-2.5 bg-gray-100 rounded w-1/4 mb-2"/>
              <div className="h-3.5 bg-gray-100 rounded w-3/4 mb-1.5"/>
              <div className="h-2.5 bg-gray-100 rounded w-full"/>
            </div>
          ))}
        </div>
      )}

      {/* Pinned */}
      {pinnedPosts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 px-1">
            <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3 text-gray-400">
              <path d="M9.5 2.5L13.5 6.5L7 9L5 14L2 11L4.5 8.5L2.5 6.5L9.5 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M10 9.5L13.5 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">고정</p>
          </div>
          {pinnedPosts.map((post: any) => <PostCard key={post.id} post={post} examMode={examMode} />)}
        </div>
      )}

      {/* Posts */}
      {!isLoading && (
        <div className="space-y-2">
          {regularPosts.map((post: any) => <PostCard key={post.id} post={post} examMode={examMode} />)}
        </div>
      )}

      {/* Load more */}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
          className="w-full py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:border-[#533afd] hover:text-[#533afd] transition-colors flex items-center justify-center gap-2">
          {isFetchingNextPage ? (
            <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="14"/></svg> 불러오는 중...</>
          ) : "더 보기"}
        </button>
      )}

      {/* Empty state */}
      {!isLoading && posts.length === 0 && (
        <div className="text-center py-12">
          <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20 mx-auto mb-4 text-gray-200">
            <rect x="10" y="20" width="60" height="50" rx="8" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M25 38h30M25 46h20M25 54h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="40" cy="12" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M37 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-gray-400 text-sm mb-3">아직 게시물이 없어요</p>
          {user ? (
            <Link href="/post/new" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#533afd] text-white rounded-full text-sm">
              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              첫 글 작성하기
            </Link>
          ) : (
            <Link href="/register" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#533afd] text-white rounded-full text-sm">
              무료 가입하기
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
