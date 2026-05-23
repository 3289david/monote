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
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.5}/>
        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: "bg-amber-50 text-amber-600",
  },
  {
    href: "/timer",
    label: "타이머",
    desc: "집중 모드",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth={1.5}/>
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
        <path d="M9 2h6" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
      </svg>
    ),
    color: "bg-rose-50 text-rose-500",
  },
  {
    href: "/groups",
    label: "스터디",
    desc: "그룹 모임",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={1.5}/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
      </svg>
    ),
    color: "bg-violet-50 text-violet-600",
  },
  {
    href: "/post/new",
    label: "글쓰기",
    desc: "질문·자료",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M12 5H5a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-7" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: "bg-indigo-50 text-[#533afd]",
  },
];

export default function FeedPage() {
  const { data: session } = useSession();
  const examMode = useUIStore((s) => s.examMode);
  const toggleExamMode = useUIStore((s) => s.toggleExamMode);
  const selectedGrade = useUIStore((s) => s.selectedGrade);
  const [activeCategory, setActiveCategory] = useState<PostCategory | "all">("all");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "hot">("latest");

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
      <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: "160px" }}>
        {/* Gradient mesh background */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, #f5e9d4 0%, #f96bee 30%, #b9b9f9 55%, #533afd 78%, #1c1e54 100%)",
        }} />
        {/* Decorative SVG blobs */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="340" cy="40" rx="120" ry="90" fill="white" fillOpacity="0.07"/>
          <ellipse cx="60" cy="160" rx="90" ry="70" fill="white" fillOpacity="0.06"/>
          <ellipse cx="200" cy="100" rx="200" ry="60" fill="white" fillOpacity="0.04"/>
          <circle cx="370" cy="150" r="50" fill="#ea2261" fillOpacity="0.2"/>
          <circle cx="30" cy="40" r="40" fill="#f96bee" fillOpacity="0.15"/>
        </svg>

        {/* Shiny star SVG */}
        <svg className="absolute top-4 right-6 w-12 h-12 text-white/20" viewBox="0 0 48 48" fill="none">
          <path d="M24 4l2.9 12.4L40 12l-9.6 9.6L44 24l-13.6 2.9L34 40l-10-9.6L24 44l-2.9-12.4L8 36l9.6-9.6L4 24l13.6-2.9L14 8l10 9.6L24 4z" fill="currentColor"/>
        </svg>
        <svg className="absolute bottom-4 left-8 w-6 h-6 text-white/15" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l1.5 6.3L20 6l-5 4.8L17 18l-5-3.4L7 18l2-7.2L4 6l6.5 2.3L12 2z" fill="currentColor"/>
        </svg>

        {/* Content */}
        <div className="relative z-10 px-5 py-5">
          {user ? (
            <div>
              <p className="text-white/80 text-xs font-medium mb-1">환영해요, {user.nickname}</p>
              <h2 className="text-white text-xl font-semibold mb-4" style={{ letterSpacing: "-0.5px" }}>
                오늘도 함께 공부해요!
              </h2>
              {/* Quick action cards */}
              <div className="grid grid-cols-4 gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <Link key={action.href} href={action.href}
                    className="flex flex-col items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-xl py-2.5 px-1 hover:bg-white transition-all active:scale-95 shadow-sm">
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", action.color)}>
                      {action.icon}
                    </div>
                    <span className="text-[10px] font-semibold text-gray-800 leading-tight text-center">{action.label}</span>
                    <span className="text-[9px] text-gray-400 leading-none text-center hidden sm:block">{action.desc}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs mb-1">학교 정보 공유 플랫폼</p>
                <h2 className="text-white text-xl font-bold mb-3" style={{ letterSpacing: "-0.5px" }}>
                  monote에 오신 걸<br/>환영해요 ✨
                </h2>
                <div className="flex gap-2">
                  <Link href="/register"
                    className="px-4 py-1.5 bg-white text-[#533afd] text-sm font-semibold rounded-full hover:bg-gray-50 transition-colors shadow-sm">
                    무료 시작
                  </Link>
                  <Link href="/login"
                    className="px-4 py-1.5 bg-white/20 text-white text-sm font-medium rounded-full hover:bg-white/30 transition-colors border border-white/30">
                    로그인
                  </Link>
                </div>
              </div>
              {/* Decorative illustration */}
              <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20 flex-shrink-0 opacity-80">
                <rect x="8" y="16" width="44" height="56" rx="6" fill="white" fillOpacity="0.25"/>
                <rect x="16" y="8" width="44" height="56" rx="6" fill="white" fillOpacity="0.35"/>
                <rect x="10" y="24" width="30" height="3" rx="1.5" fill="white" fillOpacity="0.7"/>
                <rect x="10" y="31" width="22" height="3" rx="1.5" fill="white" fillOpacity="0.7"/>
                <rect x="10" y="38" width="26" height="3" rx="1.5" fill="white" fillOpacity="0.7"/>
                <rect x="10" y="45" width="18" height="3" rx="1.5" fill="white" fillOpacity="0.7"/>
                <circle cx="58" cy="56" r="14" fill="#f96bee" fillOpacity="0.6"/>
                <path d="M54 56h8M58 52v8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
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
