"use client";
import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePosts } from "@/hooks/usePosts";
import { useTrending } from "@/hooks/useCommunity";
import PostCard from "@/components/posts/PostCard";
import { useUIStore } from "@/store/ui-store";
import { cn, timeAgo } from "@/lib/utils";
import Link from "next/link";
import type { PostCategory } from "@/types";

const CATEGORIES: { value: PostCategory | "all"; label: string; emoji: string }[] = [
  { value: "all", label: "전체", emoji: "📋" },
  { value: "exam_range", label: "시험 범위", emoji: "📝" },
  { value: "performance", label: "수행평가", emoji: "🎯" },
  { value: "materials", label: "자료실", emoji: "📂" },
  { value: "teacher_info", label: "선생님", emoji: "👨‍🏫" },
  { value: "question", label: "질문", emoji: "❓" },
];

export default function FeedPage() {
  const { data: session } = useSession();
  const examMode = useUIStore((s) => s.examMode);
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

  const { data: trendingData } = useTrending("today");
  const posts = data?.pages.flatMap((p) => p.posts) ?? [];
  const pinnedPosts = posts.filter((p: any) => p.isPinned);
  const regularPosts = posts.filter((p: any) => !p.isPinned);
  const hotToday = trendingData?.posts?.slice(0, 3) ?? [];
  const user = session?.user;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const scrollTop = (e.currentTarget as HTMLElement).scrollTop ?? 0;
    if (scrollTop > 0) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      pullDistance.current = dy;
      setPullIndicator(Math.min(dy / 80, 1));
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance.current > 80 && !isRefreshing) {
      setIsRefreshing(true);
      if (navigator.vibrate) navigator.vibrate(20);
      await refetch();
      setIsRefreshing(false);
    }
    pullDistance.current = 0;
    setPullIndicator(0);
  }, [isRefreshing, refetch]);

  const bg = examMode ? "bg-[#0f1138]" : "bg-[#f6f9fc]";
  const textColor = examMode ? "text-white" : "text-[#0d253d]";
  const mutedText = examMode ? "text-white/50" : "text-[#64748d]";

  return (
    <div
      className="space-y-3"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {(pullIndicator > 0 || isRefreshing) && (
        <div className="flex justify-center -mt-2">
          <div
            className={cn("w-8 h-8 rounded-full bg-white border border-[#e3e8ee] shadow flex items-center justify-center", isRefreshing && "animate-spin")}
            style={{ opacity: pullIndicator || (isRefreshing ? 1 : 0) }}
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-[#533afd]">
              <path d="M8 3A5 5 0 103 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
              <path d="M3 5V8H6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      )}

      {/* Exam mode banner */}
      {examMode && (
        <div className="rounded-xl bg-gradient-to-r from-[#1c1e54] to-[#2e2b8c] p-4 text-white">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">⭐</span>
            <span className="font-medium text-amber-400 text-sm">시험 직전 모드</span>
          </div>
          <p className="text-xs text-white/60 mt-0.5">중요도 높은 정보만 표시됩니다</p>
        </div>
      )}

      {/* Welcome card - logged in */}
      {user && (
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-[#533afd] to-[#1c1e54]">
          <p className="text-white/60 text-xs">{user.grade}학년 {user.classNum}반 · {user.schoolName}</p>
          <h2 className="text-lg font-light mt-0.5">
            안녕하세요, <strong className="font-medium">{user.nickname}</strong>님!
          </h2>
          <div className="flex gap-2 mt-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <Link href="/post/new" className="flex-shrink-0 text-sm px-3 py-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors">✏️ 글 쓰기</Link>
            <Link href="/dday" className="flex-shrink-0 text-sm px-3 py-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors">📅 D-Day</Link>
            <Link href="/timer" className="flex-shrink-0 text-sm px-3 py-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors">⏱️ 타이머</Link>
            <Link href="/groups" className="flex-shrink-0 text-sm px-3 py-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors">👥 스터디</Link>
          </div>
        </div>
      )}

      {/* Guest banner - not logged in */}
      {!user && !examMode && (
        <div className="rounded-xl overflow-hidden">
          <div className="bg-gradient-to-br from-[#533afd] to-[#1c1e54] p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
                <rect width="32" height="32" rx="8" fill="white" fillOpacity={0.2}/>
                <path d="M5 25V7h4.5l6.5 11 6.5-11H27v18h-4.5V14.5l-6 9-6-9V25H5z" fill="white"/>
              </svg>
              <span className="font-medium">monote</span>
            </div>
            <h2 className="text-xl font-light leading-snug">학교 정보를 쉽게<br/>공유하고 찾아보세요</h2>
            <p className="text-white/60 text-sm mt-1.5">시험 범위, 수행평가, 선생님 정보까지</p>
            <div className="flex gap-2 mt-4">
              <Link href="/register" className="px-4 py-2 bg-white text-[#533afd] rounded-full text-sm font-medium hover:bg-white/90 transition-colors">
                무료 가입
              </Link>
              <Link href="/login" className="px-4 py-2 bg-white/20 text-white rounded-full text-sm hover:bg-white/30 transition-colors">
                로그인
              </Link>
            </div>
          </div>
          <div className="bg-[#eeeaff] px-4 py-2.5 flex items-center gap-2 text-xs text-[#533afd]">
            <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 flex-shrink-0">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth={1.3}/>
              <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"/>
            </svg>
            로그인 없이도 게시물을 읽을 수 있어요. 작성·추천·저장은 로그인 후 가능합니다.
          </div>
        </div>
      )}

      {/* Hot today */}
      {hotToday.length > 0 && !examMode && (
        <div className="bg-white rounded-xl border border-[#e3e8ee] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🔥</span>
              <span className="text-sm font-medium text-[#0d253d]">오늘의 핫</span>
            </div>
            <Link href="/community" className="text-xs text-[#533afd] font-medium">더보기 →</Link>
          </div>
          <div className="space-y-2">
            {hotToday.map((post: any, i: number) => (
              <Link key={post.id} href={`/post/${post.id}`} className="flex items-center gap-2.5 group">
                <span className={cn(
                  "w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0",
                  i === 0 ? "bg-amber-400/20 text-amber-600" : "bg-[#f6f9fc] text-[#64748d]"
                )}>{i + 1}</span>
                <p className="text-sm text-[#273951] truncate group-hover:text-[#533afd] transition-colors flex-1">{post.title}</p>
                <span className="text-xs text-[#533afd] font-medium shrink-0">↑{post.voteCount}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Subject quick links */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {["수학", "국어", "영어", "과학", "사회", "역사", "물리", "화학"].map((subj) => (
          <Link key={subj} href={`/board?subject=${encodeURIComponent(subj)}`}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors",
              examMode
                ? "bg-[#1c1e54] border-[#2a2d6b] text-white/70"
                : "bg-white border-[#e3e8ee] text-[#273951] hover:border-[#533afd] hover:text-[#533afd]"
            )}>
            {subj}
          </Link>
        ))}
      </div>

      {/* Filters row */}
      <div className="space-y-2">
        {/* Category chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveCategory(f.value)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                activeCategory === f.value
                  ? "bg-[#533afd] text-white"
                  : examMode
                  ? "bg-[#1c1e54] text-white/60"
                  : "bg-white text-[#273951] border border-[#e3e8ee] hover:border-[#533afd]"
              )}
            >
              <span className="text-xs">{f.emoji}</span>
              {f.label}
            </button>
          ))}
        </div>

        {/* Count + sort */}
        <div className="flex items-center justify-between">
          <span className={cn("text-xs", mutedText)}>
            {isLoading ? "불러오는 중..." : `${posts.length}개`}
            {!user && <span className="ml-1 text-[#533afd]">· 전국 공개 게시물</span>}
          </span>
          <div className="flex gap-1 bg-white rounded-full border border-[#e3e8ee] p-0.5">
            {(["latest", "popular", "hot"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full transition-colors",
                  sortBy === s ? "bg-[#533afd] text-white" : "text-[#64748d]"
                )}
              >
                {s === "latest" ? "최신" : s === "popular" ? "인기" : "핫"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn("rounded-xl border p-4 animate-pulse", examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]")}>
              <div className={cn("h-3 rounded mb-2 w-1/4", examMode ? "bg-[#2a2d6b]" : "bg-[#f6f9fc]")}/>
              <div className={cn("h-4 rounded mb-2 w-3/4", examMode ? "bg-[#2a2d6b]" : "bg-[#f6f9fc]")}/>
              <div className={cn("h-3 rounded w-full", examMode ? "bg-[#2a2d6b]" : "bg-[#f6f9fc]")}/>
            </div>
          ))}
        </div>
      )}

      {/* Pinned posts */}
      {pinnedPosts.length > 0 && (
        <div className="space-y-2">
          <p className={cn("text-xs font-medium uppercase tracking-wider px-1", mutedText)}>📌 고정</p>
          {pinnedPosts.map((post: any) => <PostCard key={post.id} post={post} examMode={examMode} />)}
        </div>
      )}

      {/* Regular posts */}
      {!isLoading && (
        <div className="space-y-3">
          {regularPosts.map((post: any) => <PostCard key={post.id} post={post} examMode={examMode} />)}
        </div>
      )}

      {/* Load more */}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className={cn(
            "w-full py-3 rounded-xl text-sm border transition-colors",
            examMode
              ? "bg-[#1c1e54] border-[#2a2d6b] text-white/60"
              : "bg-white border-[#e3e8ee] text-[#64748d] hover:border-[#533afd]"
          )}
        >
          {isFetchingNextPage ? "불러오는 중..." : "더 보기"}
        </button>
      )}

      {/* Empty state */}
      {!isLoading && posts.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#eeeaff] flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-[#533afd]">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth={1.5}/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
            </svg>
          </div>
          <p className={cn("font-medium mb-1", textColor)}>아직 게시물이 없어요</p>
          <p className={cn("text-sm mb-4", mutedText)}>
            {user ? "첫 번째로 정보를 공유해보세요!" : "로그인 후 학교 게시물을 확인해보세요"}
          </p>
          {user ? (
            <Link href="/post/new" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#533afd] text-white rounded-full text-sm hover:bg-[#4434d4]">
              ✏️ 글 작성하기
            </Link>
          ) : (
            <Link href="/register" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#533afd] text-white rounded-full text-sm hover:bg-[#4434d4]">
              무료 가입하기
            </Link>
          )}
        </div>
      )}

      {/* Guest CTA at bottom */}
      {!user && !isLoading && posts.length > 0 && (
        <div className="rounded-xl bg-[#eeeaff] border border-[#b9b9f9] p-4 text-center">
          <p className="text-sm font-medium text-[#4434d4] mb-1">내 학교 게시물만 보고 싶다면?</p>
          <p className="text-xs text-[#64748d] mb-3">가입 후 학교를 설정하면 우리 학교 정보만 모아볼 수 있어요</p>
          <div className="flex gap-2 justify-center">
            <Link href="/register" className="px-4 py-2 bg-[#533afd] text-white rounded-full text-sm font-medium hover:bg-[#4434d4] transition-colors">
              가입하기
            </Link>
            <Link href="/login" className="px-4 py-2 bg-white text-[#533afd] rounded-full text-sm border border-[#b9b9f9] hover:bg-[#f6f9fc] transition-colors">
              로그인
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
